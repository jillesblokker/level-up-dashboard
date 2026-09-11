/**
 * data-export-service.ts
 * Provides 1-click client-side export of personal life data (Chronicle diary and Habits history).
 */

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportChronicleToMarkdown(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Try reading from local storage or cached entries
    let entries: any[] = [];
    const localKeys = ['thrivehaven_journal_entries', 'chronicle_journal_entries', 'journal_entries'];
    for (const k of localKeys) {
      const stored = localStorage.getItem(k);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            entries = parsed;
            break;
          }
        } catch {}
      }
    }

    // 2. Also try fetching from API if user is authenticated
    try {
      const res = await fetch('/api/chronicle/entries');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          entries = json.data;
        }
      }
    } catch {}

    const nowStr = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
    let md = `# Thrivehaven Chronicle Archive\n`;
    md += `*Exported on ${nowStr}*\n\n`;
    md += `> "Your thoughts, struggles, and quiet victories carved into history."\n\n`;
    md += `---\n\n`;

    if (entries.length === 0) {
      md += `*No journal entries recorded yet. Begin writing in the Chronicle to build your archive.*\n`;
    } else {
      entries.forEach((entry, index) => {
        const date = entry.entry_date || entry.created_at || entry.date || 'Unknown Date';
        const mood = entry.mood_score ? `${entry.mood_score}/5` : 'Recorded';
        const content = entry.content || entry.entry_text || entry.text || '';

        md += `### ${date} — Spirit: ${mood}\n\n`;
        md += `${content.trim()}\n\n`;
        md += `---\n\n`;
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    downloadBlob(md, `thrivehaven_chronicle_${todayDate}.md`, 'text/markdown;charset=utf-8');
    return true;
  } catch (err) {
    console.error('Failed to export chronicle to markdown:', err);
    return false;
  }
}

export async function exportHabitsToCsv(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    let quests: any[] = [];

    // Try reading from cache
    const storedQuests = localStorage.getItem('thrivehaven_active_quests_cache') || localStorage.getItem('quests');
    if (storedQuests) {
      try {
        const parsed = JSON.parse(storedQuests);
        if (Array.isArray(parsed)) quests = parsed;
      } catch {}
    }

    // Try fetching from daily quests endpoint
    try {
      const res = await fetch('/api/quests/daily');
      if (res.ok) {
        const json = await res.json();
        const list = json.data?.quests || json.quests || json;
        if (Array.isArray(list) && list.length > 0) quests = list;
      }
    } catch {}

    // Load mastered habits as well
    const mastered = (() => {
      try {
        return JSON.parse(localStorage.getItem('thrivehaven_mastered_habits') || '[]');
      } catch { return []; }
    })();

    let csv = `"Title","Category","Difficulty","Streak Days","Completed","Status","Date Recorded"\n`;

    quests.forEach(q => {
      const title = `"${(q.name || q.title || 'Habit').replace(/"/g, '""')}"`;
      const cat = `"${q.category || 'vitality'}"`;
      const diff = `"${q.difficulty || 'novice'}"`;
      const streak = q.streak || 0;
      const completed = q.completed ? "Yes" : "No";
      const status = "Active";
      const date = `"${new Date().toISOString().split('T')[0]}"`;

      csv += `${title},${cat},${diff},${streak},${completed},${status},${date}\n`;
    });

    mastered.forEach((m: any) => {
      const title = `"${(m.title || 'Mastered Habit').replace(/"/g, '""')}"`;
      const cat = `"${m.category || 'vitality'}"`;
      const diff = `"Legendary"`;
      const streak = m.streak || 66;
      const completed = "Yes";
      const status = "Mastered Monument";
      const date = `"${m.formattedDate || m.masteredDate || ''}"`;

      csv += `${title},${cat},${diff},${streak},${completed},${status},${date}\n`;
    });

    const todayDate = new Date().toISOString().split('T')[0];
    downloadBlob(csv, `thrivehaven_habits_${todayDate}.csv`, 'text/csv;charset=utf-8');
    return true;
  } catch (err) {
    console.error('Failed to export habits to CSV:', err);
    return false;
  }
}
