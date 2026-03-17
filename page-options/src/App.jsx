import { useState } from 'react'
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

  const handleSave = () => {
    const savedOptions = {
      accent,
      devMode: devMode === 'yes',
      regex: regex === 'yes',
      partialMatch: partialMatch === 'yes',
      soundsLike: soundsLike === 'yes',
      diacritic: diacritic === 'yes'
    };
    
    console.log("Saving Preferences:", savedOptions);
    alert("Your preferences have been saved!");
    // Later, you will plug in chrome.storage.local.set(savedOptions) here
  };

  return (
    <div className="options-container">
      <div className="options-card">
        
        <div className="options-header">
          <h2>Boarding Options</h2>
          <p>Customize your Majo Search experience and matching features.</p>
        </div>

        <div className="options-body">
          
          {/* Accent Row */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Voice Accent</h3>
              <p>Select your primary spoken accent for better phonetic matching.</p>
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
              <p>Enable advanced UI areas like code block targeting.</p>
            </div>
            <select value={devMode} onChange={(e) => setDevMode(e.target.value)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Regex Matching */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>RegEx Search</h3>
              <p>Show Regular Expression search tools by default.</p>
            </div>
            <select value={regex} onChange={(e) => setRegex(e.target.value)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Partial Matching */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Partial Matching (Fuzzy)</h3>
              <p>Allow searches to match incomplete or slightly misspelled words.</p>
            </div>
            <select value={partialMatch} onChange={(e) => setPartialMatch(e.target.value)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Sounds Like Matching */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Sounds-Like Matching</h3>
              <p>Match words that are spelled differently but sound the same.</p>
            </div>
            <select value={soundsLike} onChange={(e) => setSoundsLike(e.target.value)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Diacritic Filtering */}
          <div className="setting-row">
            <div className="setting-info">
              <h3>Diacritic Filtering</h3>
              <p>Show options to ignore accents and special characters (e.g., é = e).</p>
            </div>
            <select value={diacritic} onChange={(e) => setDiacritic(e.target.value)} className="select-dropdown narrow">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

        </div>

        <div className="options-footer">
          <button className="btn primary" onClick={handleSave}>Save Changes</button>
        </div>

      </div>
    </div>
  )
}

export default App