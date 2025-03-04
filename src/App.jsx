import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const API_KEY = import.meta.env.VITE_GEMINI_KEY;
  const MODEL_NAME = "gemini-1.5-flash";
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent`;

  const [value, setValue] = useState("");
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pinnedSummary, setPinnedSummary] = useState(null);
  const [isCopy, setIsCopy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!value.trim()) {
      setSubmitting(false);
      return;
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Summarize the following text in bullet point:\n\n${value}`,
              },
            ],
          },
        ],
      }),
    };

    try {
      const response = await fetch(ENDPOINT, requestOptions);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status} - ${errorData}`
        );
      }

      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;

      setSubmitting(false);

      let existingSummaries = JSON.parse(localStorage.getItem("summary")) || [];
      const updatedSummaries = [text, ...existingSummaries];

      localStorage.setItem("summary", JSON.stringify(updatedSummaries));
      setData(updatedSummaries);
    } catch (error) {
      setSubmitting(false);
      console.error("Fetch error:", error);
    }
  };

  const fetchLocalStorage = () => {
    const savedSummaries = localStorage.getItem("summary");
    const savedPinned = localStorage.getItem("pinnedSummary");

    setData(savedSummaries ? JSON.parse(savedSummaries) : []);
    setPinnedSummary(savedPinned ? JSON.parse(savedPinned) : null);
  };

  async function CopyTextToClipboard(text) {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    }
  }

  const handleCopy = (txt) => {
    CopyTextToClipboard(txt).then(() => {
      setIsCopy(true);

      setTimeout(() => {
        setIsCopy(false);
      }, 1500);
    });
  };

  const handleDelete = (txt) => {
    const filtered = data?.filter((d) => d !== txt);

    setData(filtered);
    localStorage.setItem("summary", JSON.stringify(filtered));
  };

  useEffect(() => {
    fetchLocalStorage();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white px-6">
      <header className="text-center py-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 mb-4">
          Summary!
        </h1>
        <p className="text-2xl text-indigo-200">
          Using{" "}
          <span className="font-semibold text-pink-400">Google Gemini</span>
        </p>
      </header>

      <main className="flex-grow w-full max-w-4xl flex flex-col items-center">
        <div className="w-full bg-violet-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8">
          <textarea
            placeholder="Paste your text here to summarize..."
            rows={6}
            className="w-full bg-indigo-900 bg-opacity-40 text-indigo-100 rounded-xl border border-indigo-400 p-4 text-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none placeholder-indigo-300"
            onChange={(e) => setValue(e.target.value)}
          ></textarea>

          <div className="mt-6 flex justify-center">
            {submitting ? (
              <p className="text-pink-400 text-xl animate-pulse">
                Summarizing...
              </p>
            ) : (
              <button
                className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:from-pink-600 hover:to-indigo-600 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleSubmit}
                disabled={!value.trim()}
              >
                Summarize
              </button>
            )}
          </div>
        </div>

        {pinnedSummary && (
          <div className="bg-indigo-900 bg-opacity-50 rounded-xl p-6 mb-4">
            <h3 className="text-indigo-300 text-xl text-center font-semibold">
              📌 Pinned
            </h3>
            <p className="text-indigo-100 text-lg mt-2">{pinnedSummary}</p>
          </div>
        )}

        {data?.length > 0 && (
          <div className="w-full bg-indigo-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-indigo-300">
              Summary History
            </h2>
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4">
              {data.map((d, index) => (
                <div
                  key={index}
                  className="bg-indigo-900 bg-opacity-50 rounded-xl p-6 transition duration-300 ease-in-out hover:bg-opacity-70"
                >
<ul className="list-disc list-inside text-indigo-100 text-lg mb-4 space-y-3 p-4 bg-indigo-800 bg-opacity-50 rounded-lg shadow-lg">
  {d.split("\n")
    .filter((point) => point.trim() !== "") // Remove empty lines
    .map((point, idx) => (
      <li key={idx} className="pl-4 border-l-4 border-pink-400 text-indigo-200">
        {point.replace(/^\*\s*/, "")} {/* Remove existing bullet points */}
      </li>
    ))}
</ul>

                  <div className="flex justify-end items-center space-x-4">
                    <button
                      className="text-pink-400 hover:text-pink-300 transition duration-300 ease-in-out text-sm font-medium"
                      onClick={() => handleCopy(d)}
                    >
                      {isCopy ? "Copied!" : "Copy"}
                    </button>
                    <button
                      className="text-indigo-400 hover:text-indigo-300 transition duration-300 ease-in-out text-sm font-medium"
                      onClick={() => handleDelete(d)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
