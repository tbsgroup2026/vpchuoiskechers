import os

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

state_addition = """
  // Logistics Tab State
  const [logisticsRecords, setLogisticsRecords] = useState<BusinessTripRecord[]>([]);
  const fetchLogisticsRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips/logistics");
      const data = await res.json();
      if (data.success) {
        setLogisticsRecords(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch logistics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LOGISTICS") {
      fetchLogisticsRecords();
    }
  }, [activeTab]);
"""

# Insert after const [records, setRecords] = useState<BusinessTripRecord[]>([]);
if "const [logisticsRecords, setLogisticsRecords]" not in content:
    content = content.replace("  const [records, setRecords] = useState<BusinessTripRecord[]>([]);", 
                              "  const [records, setRecords] = useState<BusinessTripRecord[]>([]);\n" + state_addition)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added logisticsRecords state to page.tsx")
