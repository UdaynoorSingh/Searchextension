import { useEffect, useState } from 'react'
import './App.css'

const accents = [
  { code: 'en-US', label: 'American English' },
  { code: 'en-GB', label: 'British English' },
  { code: 'en-IN', label: 'Indian English' },
  { code: 'en-AU', label: 'Australian English' },
  { code: 'en-CA', label: 'Canadian English' },
  { code: 'en-NZ', label: 'New Zealand English' },
  { code: 'en-ZA', label: 'South African English' },
  { code: 'en-IE', label: 'Irish English' },
  { code: 'en-SG', label: 'Singaporean English' },
  { code: 'en-PH', label: 'Philippine English' },
  { code: 'en-NG', label: 'Nigerian English' },
  { code: 'en-KE', label: 'Kenyan English' },
  { code: 'en-TZ', label: 'Tanzanian English' },
  { code: 'en-GH', label: 'Ghanaian English' },
  { code: 'en-HK', label: 'Hong Kong English' }
];

function App() {
  // Setup state for all options (defaulting to what a standard user might have)
  const [accent, setAccent] = useState('en-US');
  const [devMode, setDevMode] = useState('no');
  const [regex, setRegex] = useState('no');
  const [partialMatch, setPartialMatch] = useState('yes');
  const [soundsLike, setSoundsLike] = useState('no');
  const [diacritic, setDiacritic] = useState('no');
  const [scrollSnap, setScrollSnap] = useState('smooth'); // * alt snap
  const [theme, setTheme] = useState('standard'); // * alt snap



  useEffect(() => {
    chrome.storage.local.get([
      "isDev",
      "langDialect",
      "showMatchDiacritics",
      "showRegexSearch",
      "showFuzzySearch",
      "showPhoneticSearch",
      "scrollSnap",
      "theme"
    ], (result) => {
      if (result.isDev !== undefined) setDevMode(result.isDev);
      else setDevMode(false)
      if (result.langDialect !== undefined) setAccent(result.langDialect);
      else setAccent("en-US");
      if (result.showMatchDiacritics !== undefined) setDiacritic(result.showMatchDiacritics);
      else setDiacritic(false);
      if (result.showRegexSearch !== undefined) setRegex(result.showRegexSearch);
      else setRegex(false);
      if (result.showFuzzySearch !== undefined) setPartialMatch(result.showFuzzySearch);
      else setPartialMatch(true);
      if (result.showPhoneticSearch !== undefined) setSoundsLike(result.showPhoneticSearch);
      else setSoundsLike(true);
      if (result.scrollSnap !== undefined) setScrollSnap(result.scrollSnap);
      else setScrollSnap(false);
      if (result.theme !== undefined) setTheme(result.theme);
      else setTheme("standard");
    });
  }, []);


  useEffect(() => {
    chrome.storage.local.set({
      isDev: devMode,
      langDialect: accent,
      showMatchDiacritics: diacritic,
      scrollSnap: scrollSnap,
      showRegexSearch: regex,
      showFuzzySearch: partialMatch,
      showPhoneticSearch: soundsLike,
      theme: theme
    });
  }, [accent, devMode, regex, partialMatch, soundsLike, diacritic, scrollSnap, theme]);

  return (
    <div className="options-container">
      <div className="options-card">

        <div className="options-header">
          <h2>Options</h2>
          <p>Refresh your open tabs for the changes to take effect there.</p>
        </div>

        <div className="options-body">

          {/* Accent Row */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Voice Search Accent</h3>
              <p>Select the accent that best matches how you speak.</p>
            </div>
            <select value={accent} onChange={(e) => setAccent(e.target.value)} className="select-dropdown">
              {accents.map((a) => (
                <option key={a.code} value={a.code}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Developer Mode */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Developer Mode</h3>
              <p>Show developer mode options.</p>
            </div>
            <select value={devMode ? "yes" : "no"} onChange={(e) => setDevMode(e.target.value === "no" ? false : true)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Regex Matching */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Pattern Matching</h3>
              <p>Show pattern matching (RegEx Search) tool.</p>
            </div>
            <select value={regex ? "yes" : "no"} onChange={(e) => setRegex(e.target.value === "no" ? false : true)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Partial Matching */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Partial Matching</h3>
              <p>Show partial matching tool.</p>
            </div>
            <select value={partialMatch ? "yes" : "no"} onChange={(e) => setPartialMatch(e.target.value === "no" ? false : true)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Sounds Like Matching */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Sounds-Like Matching</h3>
              <p>show Sounds-Like matching tool.</p>
            </div>
            <select value={soundsLike ? "yes" : "no"} onChange={(e) => setSoundsLike(e.target.value === "no" ? false : true)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Diacritic Filtering */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Diacritic Filtering</h3>
              <p>Show option to acknowledge accents and special characters (e.g., é ≠ e).</p>
            </div>
            <select value={diacritic ? "yes" : "no"}
              onChange={(e) =>
                setDiacritic(e.target.value === "no" ? false : true)}
              className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <h3>Highlight Theme</h3>
              <p>Theme for highlighting matches should be</p>
            </div>
            <select value={theme}
              onChange={(e) =>
                setTheme(e.target.value)}
              className="select-dropdown narrow">
              <option value="standard">Standard (Orange & Yellow)</option>
              <option value="modern">Modern (Blue & Lightblue)</option>
              <option value="highContrast">High Contrast (Lime & Purple)</option>
            </select>
          </div>


          <div className="setting-row">
            <div className="setting-info">
              <h3>Scroll Effect</h3>
              <p>Scroll effect when moving through result should be</p>
            </div>
            <select value={scrollSnap ? "snap" : "smooth"}
              onChange={(e) =>
                setScrollSnap(e.target.value === "snap" ? true : false)}
              className="select-dropdown narrow">
              <option value="smooth">Smooth</option>
              <option value="snap">Snap</option>
            </select>
          </div>

        </div>


      </div>
    </div>
  )
}

export default App