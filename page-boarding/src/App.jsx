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
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [accent, setAccent] = useState('en-US');
  const [isDev, setIsDev] = useState(false);
  const [knowsRegex, setKnowsRegex] = useState(false);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);
  
  const handleFinish = () => {
    const userPreferences = { agreed, accent, isDev, knowsRegex };
    console.log("Onboarding Complete", userPreferences);
    alert("Onboarding Complete! You can close this tab.");
  };

  return (
    <div className="boarding-container">
      <div className="boarding-card">
        
        {/* PAGE 1: Terms & Privacy */}
        {step === 1 && (
          <div className="step-content fade-in">
            <div className="content-body">
              <h2>Welcome to Majo Search</h2>
              <p>Before we get started, please review and agree to our terms.</p>
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)} 
                />
                <span>
                  By clicking this, you agree to our <a href="#" target="_blank" rel="noreferrer">Privacy Policy and Terms</a>.
                </span>
              </label>
            </div>

            <div className="actions flex-end gap-15">
              <button className="btn primary" disabled={!agreed} onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {/* PAGE 2: Accent Selection */}
        {step === 2 && (
          <div className="step-content fade-in">
            <div className="content-body dropdown-spacer">
              <h2>Voice Search Accent</h2>
              <p>What accent do you speak? This helps us improve the phonetic and voice search accuracy.</p>
              
              <select 
                value={accent} 
                onChange={(e) => setAccent(e.target.value)} 
                className="select-input"
              >
                {accents.map((a) => (
                  <option key={a.code} value={a.code}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="actions flex-end gap-15">
              <button className="btn secondary" onClick={handlePrev}>Previous</button>
              <button className="btn primary" onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {/* PAGE 3: Developer Check */}
        {step === 3 && (
          <div className="step-content fade-in">
            <div className="content-body">
              <h2>Developer Mode</h2>
              <p>We can tailor the search panel and default areas (like searching in code blocks) based on your needs.</p>
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isDev} 
                  onChange={(e) => setIsDev(e.target.checked)} 
                />
                <span>Yes, I am a developer.</span>
              </label>
            </div>

            <div className="actions flex-end gap-15">
              <button className="btn secondary" onClick={handlePrev}>Previous</button>
              <button className="btn primary" onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {/* PAGE 4: Regex Knowledge */}
        {step === 4 && (
          <div className="step-content fade-in">
            <div className="content-body">
              <h2>Search Expertise</h2>
              <p>Knowing your expertise helps us show or hide advanced UI tools by default.</p>
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={knowsRegex} 
                  onChange={(e) => setKnowsRegex(e.target.checked)} 
                />
                <span>Yes, I have knowledge about RegEx search.</span>
              </label>
            </div>

            <div className="actions flex-end gap-15">
              <button className="btn secondary" onClick={handlePrev}>Previous</button>
              {/* Changed from Finish to Next */}
              <button className="btn primary" onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {/* PAGE 5: Final Page */}
        {step === 5 && (
          <div className="step-content fade-in">
            <div className="content-body text-center">
              <h2>You are all set to go!</h2>
              <p className="final-text">
                You can change your boarding options anytime from the <a href="/page-options/index.html" target="_blank" rel="noreferrer">boarding options page</a>.
              </p>
              
              <div className="image-wrapper">
                {/* Replace the src below with your actual image path */}
                <img 
                  src="https://via.placeholder.com/640x360/333346/c1c1d2?text=Your+16:9+Image+Here" 
                  alt="Ready to go" 
                  className="aspect-ratio-image"
                />
              </div>
            </div>

            <div className="actions flex-end gap-15">
              <button className="btn secondary" onClick={handlePrev}>Previous</button>
              <button className="btn finish" onClick={handleFinish}>Finish</button>
            </div>
          </div>
        )}
      </div>
        <div style={{textAlign: "center", marginTop: "30px" }}>These questions are asked to improve your experience</div>
    </div>
  )
}

export default App