export function homePathFor(userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;

  if (role === 'superadmin') return '/superadmin';
  if (role === 'admin') return '/admin';
  if (role === 'enterprise') return '/entreprise';
  return '/student';
}
