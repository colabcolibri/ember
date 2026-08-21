export function memberHomePath(profileComplete: boolean | null | undefined): string {
  return profileComplete ? '/presence' : '/profile';
}
