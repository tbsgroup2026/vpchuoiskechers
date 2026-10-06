async function fetchAndFindDiff() {
  const res = await fetch("https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen");
  const data = await res.json();
  const proposals = data.proposals || [];

  const archived = proposals.filter(p => {
    return Boolean(p.is_archived) || p.sub_status === "LUU_TRU" || p.registration_type === "LUU_TRU" || p.status === "ARCHIVED";
  });

  console.log("Archived count:", archived.length);
  archived.forEach(p => {
    console.log(`ID: ${p.id}, Tiêu đề: ${p.title || p.before_description}, Created At: ${p.created_at}, Site Code: ${p.site_code}`);
  });
}
fetchAndFindDiff();
