export function getEntrataSyncStatus() {
  const configured = !!(
    process.env.ENTRATA_BASE_URL &&
    process.env.ENTRATA_USERNAME &&
    process.env.ENTRATA_PASSWORD
  );

  return {
    configured,
    label: configured ? "Entrata synced" : "Entrata sync pending",
    badgeClass: configured
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-amber-50 border-amber-200 text-amber-700",
  };
}
