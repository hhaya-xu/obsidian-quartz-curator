function repositoryCoordinates(repository) {
  const match = repository.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/u,
  );
  if (!match) throw new Error("GITHUB_REPOSITORY_INVALID");
  return { owner: match[1], repository: match[2] };
}

export function verifyRemote({ actionStatus, pages }) {
  if (actionStatus !== "success")
    return { status: "FAIL", errorCode: "GITHUB_ACTIONS_FAILED" };
  if (pages.some((page) => page.status < 200 || page.status >= 400)) {
    return { status: "FAIL", errorCode: "LIVE_RESOURCE_FAILED" };
  }
  return { status: "PASS", errorCode: null };
}

export async function verifyGitHubPublication({
  repository,
  branch,
  commitSha,
  liveUrls,
  token = process.env.GITHUB_TOKEN,
  fetchImpl = fetch,
  sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  maxAttempts = 30,
  intervalMs = 10_000,
}) {
  const coordinates = repositoryCoordinates(repository);
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let selectedRun = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchImpl(
      `https://api.github.com/repos/${coordinates.owner}/${coordinates.repository}/actions/runs?branch=${encodeURIComponent(branch)}&event=push&per_page=20`,
      { headers },
    );
    if (!response.ok)
      throw new Error(`GITHUB_ACTIONS_API_FAILED: ${response.status}`);
    const body = await response.json();
    selectedRun =
      body.workflow_runs?.find((run) => run.head_sha === commitSha) ?? null;
    if (selectedRun?.status === "completed") break;
    if (attempt + 1 < maxAttempts) await sleep(intervalMs);
  }

  const actionStatus = selectedRun?.conclusion ?? "timeout";
  const pages = [];
  if (actionStatus === "success") {
    for (const url of liveUrls) {
      const response = await fetchImpl(url, { redirect: "follow" });
      pages.push({ url, status: response.status });
    }
  }
  const verified = verifyRemote({ actionStatus, pages });
  return {
    actionRunId: selectedRun?.id ?? null,
    actionStatus,
    pages,
    ...verified,
  };
}
