export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
}

export function branchNameFromTitle(title: string): string {
  const slug = slugifyTitle(title) || "story";
  return `feat/${slug}`;
}

export function uniqueBranchName(
  base: string,
  existing: Iterable<string>,
): string {
  const taken = new Set(existing);

  if (!taken.has(base)) {
    return base;
  }

  let counter = 2;

  while (taken.has(`${base}-${counter}`)) {
    counter += 1;
  }

  return `${base}-${counter}`;
}

/// Turns a git branch into a human-readable card title, e.g.
/// `feat/add-login-flow` -> `Add login flow`.
export function titleFromBranch(branch: string): string {
  const withoutPrefix = branch.replace(
    /^(feat|feature|fix|bugfix|hotfix|chore|refactor|test|docs)\//i,
    "",
  );
  const words = withoutPrefix
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!words) {
    return branch;
  }

  return words.charAt(0).toUpperCase() + words.slice(1);
}
