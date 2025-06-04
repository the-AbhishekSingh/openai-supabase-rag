import React, { useState } from "react";

type Grant = {
  grant_name: string;
  organization: string;
  description: string;
  link: string;
};

export default function Web3Grants() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to parse grants from the answer string
  function parseGrants(answer: string): Grant[] | null {
    // Each grant is separated by two newlines
    const grantBlocks = answer.split("\n\n").filter((block) => block.includes("Grant:"));
    if (grantBlocks.length === 0) return null;
    return grantBlocks.map((block) => {
      const name = block.match(/Grant: (.*)/)?.[1] || "";
      const org = block.match(/Organization: (.*)/)?.[1] || "";
      const desc = block.match(/Description: (.*)/)?.[1] || "";
      const link = block.match(/Link: (.*)/)?.[1] || "";
      return {
        grant_name: name,
        organization: org,
        description: desc,
        link,
      };
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    setGrants(null);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // Try to parse grants, otherwise show as plain text
      const parsed = parseGrants(data.answer);
      if (parsed && parsed.length > 0) {
        setGrants(parsed);
        setAnswer(null);
      } else {
        setAnswer(data.answer);
        setGrants(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render HTML content safely
  const renderHtml = (html: string) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Web3 Grants Q&amp;A</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about web3 grants..."
          style={{ width: "70%", padding: 8, fontSize: 16 }}
        />
        <button 
          type="submit" 
          style={{ padding: "8px 16px", marginLeft: 8, fontSize: 16 }}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Ask'}
        </button>
      </form>
      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          Error: {error}
        </div>
      )}
      {grants && (
        <table border={1} cellPadding={8} style={{ width: "100%", marginTop: 16 }}>
          <thead>
            <tr>
              <th>Grant Name</th>
              <th>Organization</th>
              <th>Description</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {grants.map((g, i) => (
              <tr key={i}>
                <td>{g.grant_name}</td>
                <td>{g.organization}</td>
                <td>{g.description}</td>
                <td>{renderHtml(g.link)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {answer && (
        <div style={{ marginTop: 24, whiteSpace: "pre-line", fontSize: 18 }}>
          {renderHtml(answer)}
        </div>
      )}
    </div>
  );
} 