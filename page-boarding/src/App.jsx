import { useEffect, useState } from 'react'
import './App.css'
import './Playground.css'


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
  const [shortcut, setShortcut] = useState(null); // ? Default is "Ctrl+Shift+F"

  const [hasBoarded, setHasBoarded] = useState(null);


  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleFinish = () => {
    chrome.storage.local.set({
      langDialect: accent, isDev: isDev, showRegexSearch: knowsRegex,
      hasBoarded: true
    });


    chrome.contextMenus.update(
      "playground-ctx-menu",
      { title: "Playground" }
    );

    setHasBoarded(true);
  };

  useEffect(() => {
    chrome.storage.local.get(["hasBoarded"]).then(result => {
      setHasBoarded(result.hasBoarded);
    });
  }, []);

  useEffect(() => {
    const fetchShortcut = () => {
      chrome.commands.getAll().then((cmds) => {
        const cmd = cmds.find(c => c.name === "search-current-page");
        if (cmd) setShortcut(cmd.shortcut);
      });
    };

    fetchShortcut();

    window.addEventListener('focus', fetchShortcut);
    return () => window.removeEventListener('focus', fetchShortcut);
  }, []);

  useEffect(() => {
    if (hasBoarded) {
      document.title = "Playground | Majo Search";
    }
    else document.title = "Boarding | Majo Search";
  }, [hasBoarded]);


  return (

    <>
      {
        hasBoarded === null ? null :
          hasBoarded === false ?
            <div className="boarding-container">
              <div className="boarding-card">

                {/* PAGE 1: Terms & Privacy */}
                {step === 1 && (
                  <div className="step-content fade-in">
                    <div className="content-body">
                      <h2>Welcome to Majo Search</h2>
                      <p>Before we get started, please review our privacy policy.</p>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <span>
                          By clicking this, you agree to our <a href="https://ainoyash.github.io/Majo-Search/privacy-policy.html" target="_blank" rel="noreferrer">Privacy Policy and Terms</a>.
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
                      <p>Select the accent that best matches how you speak.</p>

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
                      <p>Adds some customizations for developers/programmers.</p>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isDev}
                          onChange={(e) => setIsDev(e.target.checked)}
                        />
                        <span>Yes, I am a developer/programmer.</span>
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
                      <h2>Pattern Matching (RegEx Search)</h2>
                      <p>Use JS Regular Expressions for complex pattern matching.</p>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={knowsRegex}
                          onChange={(e) => setKnowsRegex(e.target.checked)}
                        />
                        <span>Yes, I want to use pattern matching (RegEx Search).</span>
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
                      <h2>You are all set!</h2>
                      <p className="final-text">
                        You can change/find more options anytime from the <a onClick={(e) => {
                          e.preventDefault();
                          chrome.tabs.create({ url: chrome.runtime.getURL("page-options/dist/index.html") });
                        }} target="_blank" rel="noreferrer">Options page</a>.
                        <br />
                        You may also visit <a onClick={(e) => {
                          e.preventDefault();
                          chrome.tabs.create({ url: chrome.runtime.getURL("page-tips-tricks-and-help/index.html") });
                        }} target="_blank" >Tricks, Tips and Help page</a>.

                      </p>


                      <div className="image-wrapper">
                        {/* Replace the src below with your actual image path */}
                        <img
                          src="output.gif"
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
              <div style={{ textAlign: "center", marginTop: "10px" }}>These questions will be used to improve your experience.</div>
            </div> :
            <div className="playground-container fade-in">

              <div>
                <h1 className="playground-title">Playground</h1>
                <p className="playground-subtitle">
                  {shortcut !== "" ? (
                    <h3>
                      Press <strong style={{ color: "var(--gothic-white)" }}>{shortcut}</strong> or <strong style={{ color: "var(--gothic-white)" }}>click the extension icon</strong> to start.<br />
                    </h3>
                  ) : (
                    <h3>
                      <strong style={{ color: "var(--gothic-white)" }}>
                        <a
                          onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: "chrome://extensions/shortcuts" }); }}>
                          Set a shortcut</a>
                      </strong> or <strong style={{ color: "var(--gothic-white)" }}>click the extension icon</strong> to start.<br />
                    </h3>
                  )}
                  You can change the shortcut by going to the <a onClick={(e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
                  }}>extension shortcuts page</a>.
                </p>
              </div>

              <div className="playground-instructions">
                <strong style={{ color: "var(--gothic-white)" }}>Try testing the search modes:</strong>
                <ul>
                  <li>Try searching <strong style={{ color: "var(--gothic-white)" }}>"lemon"</strong> in Exact mode</li>
                  <li>Try searching <strong style={{ color: "var(--gothic-white)" }}>"melon"</strong> in Partial mode</li>
                  <li>Try searching <strong style={{ color: "var(--gothic-white)" }}>"lemoon"</strong> in Sounds like mode</li>
                </ul>
              </div>

              <div className="playground-text-box">
                When visiting the local market, making the perfect summer drink requires the right ingredients. A fresh lemon provides that sharp, zesty kick everyone loves. Sometimes, people get creative and mix it with sweet melon for a refreshing twist. Interestingly, kids often misspell it as 'leemon' on their handmade lemonade stand signs, but the delicious taste remains exactly the same.
              </div>
            </div>
      }
    </>

  )
}

export default App