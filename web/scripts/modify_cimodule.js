const fs = require('fs');

let content = fs.readFileSync('src/modules/ci/CIModule.tsx', 'utf8');

// 1. Add states
content = content.replace(
  '  const [selectedRegType, setSelectedRegType] = useState("ALL");\r\n  const [selectedMonthYear, setSelectedMonthYear] = useState("ALL");',
  '  const [selectedRegType, setSelectedRegType] = useState("ALL");\r\n  const [selectedMonthYear, setSelectedMonthYear] = useState("ALL");\r\n  const [kaizenVersion, setKaizenVersion] = useState<string | null>(null);\r\n  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);\r\n  const [networkError, setNetworkError] = useState<boolean>(false);'
);

// 2. Remove localStorage cache in fetchProposals
content = content.replace(
  `        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(PROPOSALS_CACHE_KEY, JSON.stringify(json.data));
          } catch (e) {}
        }`,
  `        setLastUpdateTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        // Cache removed for hybrid`
);

content = content.replace(
  `      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(PROPOSALS_CACHE_KEY, JSON.stringify(next));
        } catch (e) {}
      }`,
  `      // Cache removed for hybrid`
);

// 3. Replace useEffect polling
const oldEffect = `  useEffect(() => {
    // Auto-sync proposals from individual factory links on mount
    fetch("/api/ci-kaizen/sync", { method: "POST" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          fetchProposals(true);
          refetchStatusCounts();
        }
      })
      .catch(() => {});

    fetchProposals(proposals.length > 0);

    // Automatic short-interval background polling for real-time UI/leaderboard updates
    let pollCount = 0;
    const pollInterval = registerPoller(
      setInterval(() => {
        fetchProposals(true);
        fetchMyScores();
        pollCount++;
        if (pollCount % 3 === 0) {
          fetch("/api/ci-kaizen/sync", { method: "POST" })
            .then((res) => res.json())
            .then((json) => {
              if (json.success) {
                fetchProposals(true);
                refetchStatusCounts();
              }
            })
            .catch(() => {});
        } else if (pollCount % 5 === 0) {
          refetchStatusCounts();
        }
      }, 45000)
    );
    return () => unregisterPoller(pollInterval);
  }, []);`;

const newEffect = `  useEffect(() => {
    fetchProposals(proposals.length > 0);
    fetchMyScores();
    refetchStatusCounts();

    let versionPollTimeout: NodeJS.Timeout;
    let errorWaitTime = 5000;
    
    const checkVersion = async () => {
      if (document.hidden) {
        versionPollTimeout = setTimeout(checkVersion, 3000);
        return;
      }

      try {
        const res = await fetch("/api/kaizen/version?region=THKG");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        
        setNetworkError(false);
        errorWaitTime = 5000;

        if (data.version) {
          setKaizenVersion(prev => {
            if (prev !== null && prev !== data.version) {
              fetchProposals(true);
              refetchStatusCounts();
            }
            return data.version;
          });
        }
        
        versionPollTimeout = setTimeout(checkVersion, 4000); 
      } catch (e) {
        setNetworkError(true);
        versionPollTimeout = setTimeout(checkVersion, errorWaitTime);
        errorWaitTime = Math.min(errorWaitTime * 2, 30000); 
      }
    };

    checkVersion();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(versionPollTimeout);
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(versionPollTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);`;

content = content.replace(oldEffect, newEffect);

// 4. Update UI
const oldBanner = `      <main className="flex-1 p-4 lg:p-6 space-y-4 min-w-0 overflow-x-hidden">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
            <IconSparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {activeTab === "DASHBOARD" ? (`;

const newBanner = `      <main className="flex-1 p-4 lg:p-6 space-y-4 min-w-0 overflow-x-hidden">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
            <IconSparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {networkError && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-rose-50 text-rose-700 font-extrabold text-xs shadow-sm flex items-center gap-2 border border-rose-200 animate-in slide-in-from-top-2">
            <IconRefresh size={16} className="animate-spin text-rose-500" />
            <span>Mất kết nối với dữ liệu Nguồn, đang thử lại...</span>
          </div>
        )}

        {activeTab === "DASHBOARD" ? (`;

content = content.replace(oldBanner, newBanner);

const oldRefresh = `                  <IconList size={15} />
                    <span>Danh sách</span>
                  </button>
                </div>

                <button
                  onClick={() => fetchProposals(false)}`;

const newRefresh = `                  <IconList size={15} />
                    <span>Danh sách</span>
                  </button>
                </div>
                
                {lastUpdateTime && (
                  <span className="text-[10px] text-slate-500 font-bold ml-2">Cập nhật lúc {lastUpdateTime}</span>
                )}

                <button
                  onClick={() => fetchProposals(false)}`;

content = content.replace(oldRefresh, newRefresh);

fs.writeFileSync('src/modules/ci/CIModule.tsx', content);
