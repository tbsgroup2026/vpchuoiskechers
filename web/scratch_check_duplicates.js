async function checkDuplicates() {
  const res = await fetch("https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen");
  const data = await res.json();
  const proposals = data.proposals || [];
  
  const idCounts = {};
  proposals.forEach(p => {
    idCounts[p.id] = (idCounts[p.id] || 0) + 1;
  });
  
  const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
  console.log("Duplicate IDs:", duplicates);
}
checkDuplicates();
