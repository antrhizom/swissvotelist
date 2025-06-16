import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Check,
  X,
  Plus,
  Minus,
  Info,
  PlayCircle,
  Printer,
  ChevronRight,
} from "lucide-react";

// Tutorial-Schritte außerhalb der Komponente definieren
const tutorialSteps = [
  {
    id: "basic",
    title: "Aufgabe 1: Vorgedruckte Liste wählen",
    description:
      "Wählen Sie die Liste der SP und behalten Sie alle Kandidaten.",
    instruction:
      'Klicken Sie auf "SP - Sozialdemokratische Partei" bei der Listenauswahl.',
    check: (state) => state.selectedList === "sp",
    hint: "Die vorgedruckten Kandidaten erscheinen automatisch auf Ihrem Wahlzettel.",
  },
  {
    id: "strike",
    title: "Aufgabe 2: Kandidaten streichen",
    description: "Wählen Sie die FDP-Liste und streichen Sie einen Kandidaten.",
    instruction:
      "Wählen Sie die FDP-Liste und entfernen Sie einen beliebigen Kandidaten mit dem X-Button.",
    check: (state) => state.selectedList === "fdp" && state.ballot.length === 3,
    hint: "Klicken Sie auf das rote X neben einem Kandidatennamen.",
  },
  {
    id: "panaschieren",
    title: "Aufgabe 3: Panaschieren",
    description:
      "Wählen Sie die GRÜNE-Liste und fügen Sie einen Kandidaten der SP hinzu.",
    instruction:
      "Wählen Sie zuerst die GRÜNE-Liste, streichen Sie einen GRÜNEN-Kandidaten und fügen Sie dann einen SP-Kandidaten hinzu.",
    check: (state) =>
      state.selectedList === "gruene" &&
      state.ballot.some((c) => c.party === "sp") &&
      state.ballot.length === 4,
    hint: 'Entfernen Sie zuerst einen Kandidaten, dann klicken Sie bei der SP auf "+ Name" um diesen hinzuzufügen.',
  },
  {
    id: "kumulieren",
    title: "Aufgabe 4: Kumulieren",
    description:
      "Wählen Sie eine leere Liste und fügen Sie denselben Kandidaten zweimal hinzu.",
    instruction:
      'Wählen Sie "Leere Liste", geben Sie einen Namen ein (z.B. "Meine Liste") und fügen Sie denselben Kandidaten zweimal hinzu.',
    check: (state) => {
      const counts = {};
      state.ballot.forEach((c) => {
        counts[c.id] = (counts[c.id] || 0) + 1;
      });
      return (
        state.selectedList === "empty" &&
        Object.values(counts).some((count) => count === 2)
      );
    },
    hint: "Klicken Sie zweimal auf denselben Kandidaten bei der Kandidatenauswahl.",
  },
  {
    id: "mixed",
    title: "Aufgabe 5: Gemischte Liste",
    description:
      "Erstellen Sie eine leere Liste mit Kandidaten aus mindestens 3 verschiedenen Parteien.",
    instruction:
      'Wählen Sie "Leere Liste" und fügen Sie je einen Kandidaten von mindestens 3 verschiedenen Parteien hinzu.',
    check: (state) => {
      const parties = new Set(state.ballot.map((c) => c.party));
      return state.selectedList === "empty" && parties.size >= 3;
    },
    hint: "Wählen Sie Kandidaten aus verschiedenen Parteien aus.",
  },
];

const SwissElectionTool = () => {
  const [selectedList, setSelectedList] = useState("");
  const [customListName, setCustomListName] = useState("");
  const [ballot, setBallot] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialMode, setTutorialMode] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const printRef = useRef(null);

  // Beispieldaten für Parteien und Kandidaten
  const parties = [
    {
      id: "sp",
      name: "SP - Sozialdemokratische Partei",
      color: "bg-red-500",
      candidates: [
        { id: "sp1", name: "Anna Müller", party: "sp" },
        { id: "sp2", name: "Peter Schmidt", party: "sp" },
        { id: "sp3", name: "Laura Weber", party: "sp" },
        { id: "sp4", name: "Thomas Fischer", party: "sp" },
      ],
    },
    {
      id: "fdp",
      name: "FDP - Die Liberalen",
      color: "bg-blue-500",
      candidates: [
        { id: "fdp1", name: "Maria Schneider", party: "fdp" },
        { id: "fdp2", name: "Hans Meier", party: "fdp" },
        { id: "fdp3", name: "Julia Keller", party: "fdp" },
        { id: "fdp4", name: "Robert Wagner", party: "fdp" },
      ],
    },
    {
      id: "svp",
      name: "SVP - Schweizerische Volkspartei",
      color: "bg-green-700",
      candidates: [
        { id: "svp1", name: "Beat Zimmermann", party: "svp" },
        { id: "svp2", name: "Ursula Bauer", party: "svp" },
        { id: "svp3", name: "Stefan Huber", party: "svp" },
        { id: "svp4", name: "Claudia Meyer", party: "svp" },
      ],
    },
    {
      id: "gruene",
      name: "GRÜNE",
      color: "bg-green-500",
      candidates: [
        { id: "gr1", name: "Eva Brunner", party: "gruene" },
        { id: "gr2", name: "Jonas Lehmann", party: "gruene" },
        { id: "gr3", name: "Sophie Gerber", party: "gruene" },
        { id: "gr4", name: "Marc Steiner", party: "gruene" },
      ],
    },
  ];

  const maxSeats = 4; // Anzahl zu wählender Sitze

  // Ballot zurücksetzen
  const resetBallot = useCallback(() => {
    setSelectedList("");
    setCustomListName("");
    setBallot([]);
    setShowResults(false);
  }, []);

  // Tutorial-Überprüfung mit useEffect
  useEffect(() => {
    if (!tutorialMode || isTransitioning) return;

    const currentStep = tutorialSteps[currentTutorialStep];

    // Verwende eine lokale Variable anstatt tutorialCompleted im Check
    if (currentStep.check({ selectedList, ballot, customListName })) {
      setTutorialCompleted((prevCompleted) => {
        // Prüfe ob Schritt bereits abgeschlossen
        if (prevCompleted.includes(currentStep.id)) {
          return prevCompleted;
        }

        // Markiere als abgeschlossen und starte Übergang
        setIsTransitioning(true);

        setTimeout(() => {
          if (currentTutorialStep < tutorialSteps.length - 1) {
            setCurrentTutorialStep(currentTutorialStep + 1);
            resetBallot();
          } else {
            alert(
              "Gratulation! Sie haben alle Übungen erfolgreich abgeschlossen. Jetzt können Sie frei experimentieren."
            );
            setTutorialMode(false);
            resetBallot();
          }
          setIsTransitioning(false);
        }, 1500);

        return [...prevCompleted, currentStep.id];
      });
    }
  }, [
    selectedList,
    ballot,
    customListName,
    tutorialMode,
    currentTutorialStep,
    isTransitioning,
    resetBallot,
  ]);

  // Druckfunktion
  const handlePrint = () => {
    // Berechne Ergebnisse für die Druckansicht
    const results = calculateResults();
    const totalVotes = Object.values(results.partyVotes).reduce(
      (sum, votes) => sum + votes,
      0
    );

    // Vereinfachte Sitzberechnung (Proporz)
    const seatDistribution = {};
    let remainingSeats = maxSeats;

    // Erste Verteilung: Ganze Sitze nach Stimmanteil
    parties.forEach((party) => {
      const voteShare = results.partyVotes[party.id] / totalVotes;
      const seats = Math.floor(voteShare * maxSeats);
      seatDistribution[party.id] = seats;
      remainingSeats -= seats;
    });

    // Restliche Sitze nach grösstem Rest verteilen
    if (remainingSeats > 0) {
      const remainders = parties
        .map((party) => ({
          id: party.id,
          remainder:
            (results.partyVotes[party.id] / totalVotes) * maxSeats -
            seatDistribution[party.id],
        }))
        .sort((a, b) => b.remainder - a.remainder);

      for (let i = 0; i < remainingSeats; i++) {
        seatDistribution[remainders[i].id]++;
      }
    }

    const windowPrint = window.open(
      "",
      "",
      "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0"
    );

    windowPrint.document.write(`
      <html>
        <head>
          <title>Wahlzettel - Nationalratswahl</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin-bottom: 10px; }
            .list-name { background-color: #f0f0f0; padding: 10px; margin: 20px 0; text-align: center; }
            .candidates { margin: 20px 0; }
            .candidate-line { border-bottom: 1px solid #ccc; padding: 10px 0; display: flex; }
            .line-number { width: 30px; }
            .candidate-name { flex: 1; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ccc; }
            .results { margin-top: 40px; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
            .results h2 { font-size: 20px; margin-bottom: 15px; }
            .results table { width: 100%; border-collapse: collapse; }
            .results th, .results td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .results th { background-color: #e0e0e0; font-weight: bold; }
            .results .seats { font-weight: bold; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>WAHLZETTEL</h1>
            <p>Nationalratswahl - ${maxSeats} Sitze</p>
            <p>Datum: ${new Date().toLocaleDateString("de-CH")}</p>
          </div>
          ${
            selectedList !== "empty"
              ? `
            <div class="list-name">
              <strong>Liste: ${
                parties.find((p) => p.id === selectedList)?.name || ""
              }</strong>
            </div>
          `
              : customListName
              ? `
            <div class="list-name">
              <strong>Liste: ${customListName}</strong>
            </div>
          `
              : ""
          }
          <div class="candidates">
            ${Array.from({ length: maxSeats })
              .map((_, i) => {
                const candidate = ballot[i];
                return `
                <div class="candidate-line">
                  <span class="line-number">${i + 1}.</span>
                  <span class="candidate-name">
                    ${
                      candidate
                        ? `${candidate.name} (${
                            parties.find((p) => p.id === candidate.party)?.name
                          })`
                        : "_________________________________"
                    }
                  </span>
                </div>
              `;
              })
              .join("")}
          </div>
          <div class="footer">
            <p>Verwendete Stimmen: ${ballot.length} / ${maxSeats}</p>
            <p>Leere Linien: ${maxSeats - ballot.length}</p>
          </div>
          
          <div class="results">
            <h2>Sitzverteilung (basierend auf diesem Wahlzettel)</h2>
            <table>
              <thead>
                <tr>
                  <th>Partei</th>
                  <th>Stimmen</th>
                  <th>Stimmenanteil</th>
                  <th class="seats">Sitze</th>
                </tr>
              </thead>
              <tbody>
                ${parties
                  .map((party) => {
                    const votes = results.partyVotes[party.id];
                    const percentage =
                      totalVotes > 0
                        ? ((votes / totalVotes) * 100).toFixed(1)
                        : "0.0";
                    const seats = seatDistribution[party.id];
                    return votes > 0
                      ? `
                    <tr>
                      <td>${party.name}</td>
                      <td>${votes}</td>
                      <td>${percentage}%</td>
                      <td class="seats">${seats}</td>
                    </tr>
                  `
                      : "";
                  })
                  .join("")}
              </tbody>
            </table>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">
              Hinweis: Diese Sitzverteilung basiert nur auf diesem einzelnen Wahlzettel. 
              In der Realität werden alle abgegebenen Wahlzettel zusammengezählt.
            </p>
          </div>
        </body>
      </html>
    `);

    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  };

  // Wähle eine vorgedruckte Liste
  const selectPrePrintedList = (partyId) => {
    if (partyId === "empty") {
      setSelectedList("empty");
      setBallot([]);
    } else {
      const party = parties.find((p) => p.id === partyId);
      setSelectedList(partyId);
      setBallot(party.candidates.map((c) => ({ ...c, count: 1 })));
    }
    setShowResults(false);
  };

  // Füge Kandidat zur Liste hinzu (Panaschieren)
  const addCandidate = (candidate) => {
    const currentCount = ballot.filter((c) => c.id === candidate.id).length;
    const totalCandidates = ballot.reduce((sum, c) => sum + c.count, 0);

    if (totalCandidates >= maxSeats) {
      alert(`Sie können maximal ${maxSeats} Kandidaten wählen.`);
      return;
    }

    if (currentCount >= 2) {
      alert("Ein Kandidat kann maximal 2x aufgeführt werden (Kumulieren).");
      return;
    }

    setBallot([...ballot, { ...candidate, count: 1 }]);
    setShowResults(false);
  };

  // Entferne Kandidat von der Liste
  const removeCandidate = (index) => {
    const newBallot = [...ballot];
    newBallot.splice(index, 1);
    setBallot(newBallot);
    setShowResults(false);
  };

  // Berechne Stimmen
  const calculateResults = () => {
    const candidateVotes = {};
    const partyVotes = {};

    // Initialisiere Stimmen
    parties.forEach((party) => {
      partyVotes[party.id] = 0;
      party.candidates.forEach((candidate) => {
        candidateVotes[candidate.id] = 0;
      });
    });

    // Zähle Kandidatenstimmen
    ballot.forEach((candidate) => {
      candidateVotes[candidate.id] =
        (candidateVotes[candidate.id] || 0) + candidate.count;
    });

    // Berechne Parteistimmen
    if (selectedList && selectedList !== "empty") {
      // Listenstimmen = Anzahl leerer Linien
      const usedLines = ballot.reduce((sum, c) => sum + c.count, 0);
      const emptyLines = maxSeats - usedLines;
      partyVotes[selectedList] += emptyLines;
    }

    // Kandidatenstimmen zählen auch für ihre Partei
    ballot.forEach((candidate) => {
      partyVotes[candidate.party] += candidate.count;
    });

    return { candidateVotes, partyVotes };
  };

  const results = showResults ? calculateResults() : null;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Interaktives Tool: Schweizer Listenwahl
      </h1>

      {!tutorialMode && showTutorial && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <Info className="mr-2" size={20} />
                So funktioniert die Listenwahl
              </h2>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  <strong>Vorgedruckte Liste:</strong> Wählen Sie eine
                  Parteiliste mit vorgedruckten Kandidaten
                </li>
                <li>
                  <strong>Leere Liste:</strong> Stellen Sie Ihre eigene
                  Kandidatenliste zusammen
                </li>
                <li>
                  <strong>Panaschieren:</strong> Fügen Sie Kandidaten anderer
                  Parteien zu Ihrer Liste hinzu
                </li>
                <li>
                  <strong>Kumulieren:</strong> Schreiben Sie denselben
                  Kandidaten bis zu 2x auf
                </li>
                <li>
                  <strong>Streichen:</strong> Entfernen Sie unerwünschte
                  Kandidaten von der Liste
                </li>
              </ul>
              <button
                onClick={() => {
                  setTutorialMode(true);
                  setShowTutorial(false);
                  setIsTransitioning(false);
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <PlayCircle className="mr-2" size={20} />
                Interaktives Tutorial starten
              </button>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="ml-4 text-blue-600 hover:text-blue-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {tutorialMode && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-green-900">
              Tutorial - Schritt {currentTutorialStep + 1} von{" "}
              {tutorialSteps.length}
            </h2>
            <button
              onClick={() => {
                setTutorialMode(false);
                setIsTransitioning(false);
                resetBallot();
              }}
              className="text-green-700 hover:text-green-900"
            >
              Tutorial beenden
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {tutorialSteps[currentTutorialStep].title}
            </h3>
            <p className="text-green-700 mb-2">
              {tutorialSteps[currentTutorialStep].description}
            </p>
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="text-sm">
                <strong>Anleitung:</strong>{" "}
                {tutorialSteps[currentTutorialStep].instruction}
              </p>
              {tutorialCompleted.includes(
                tutorialSteps[currentTutorialStep].id
              ) && (
                <p className="text-green-600 mt-2 flex items-center">
                  <Check size={20} className="mr-1" />
                  Aufgabe erfolgreich gelöst!
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {tutorialSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded ${
                  tutorialCompleted.includes(step.id)
                    ? "bg-green-500"
                    : index === currentTutorialStep
                    ? "bg-green-300"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Linke Seite: Parteien und Kandidaten */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            1. Wählen Sie eine Liste
          </h2>

          <div className="space-y-2 mb-6">
            <div>
              <button
                onClick={() => selectPrePrintedList("empty")}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  selectedList === "empty"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="font-semibold">Leere Liste</div>
                <div className="text-sm text-gray-600">
                  Stellen Sie Ihre eigene Liste zusammen
                </div>
              </button>

              {selectedList === "empty" && (
                <div className="mt-2 px-3">
                  <input
                    type="text"
                    placeholder="Listenbezeichnung eingeben (optional)"
                    value={customListName}
                    onChange={(e) => setCustomListName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    maxLength={50}
                  />
                </div>
              )}
            </div>

            {parties.map((party) => (
              <button
                key={party.id}
                onClick={() => selectPrePrintedList(party.id)}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  selectedList === party.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded ${party.color} mr-2`}></div>
                  <div className="font-semibold">{party.name}</div>
                </div>
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4">
            2. Kandidaten hinzufügen (Panaschieren)
          </h2>

          <div className="space-y-4">
            {parties.map((party) => (
              <div key={party.id} className="border rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded ${party.color} mr-2`}></div>
                  <h3 className="font-semibold text-sm">{party.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {party.candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => addCandidate(candidate)}
                      className="text-sm p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-left"
                    >
                      <Plus size={14} className="inline mr-1" />
                      {candidate.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rechte Seite: Wahlzettel */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Ihr Wahlzettel</h2>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer size={18} className="mr-2" />
              Drucken
            </button>
          </div>

          <div
            ref={printRef}
            className="bg-white border-2 border-gray-400 rounded-lg p-6 min-h-[400px]"
          >
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg">WAHLZETTEL</h3>
              <p className="text-sm text-gray-600">
                Nationalratswahl - {maxSeats} Sitze
              </p>
              {selectedList && (
                <div className="mt-2">
                  <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded">
                    {selectedList !== "empty" ? (
                      <>
                        <div
                          className={`w-3 h-3 rounded ${
                            parties.find((p) => p.id === selectedList)?.color
                          } mr-2`}
                        ></div>
                        <span className="text-sm font-semibold">
                          Liste:{" "}
                          {parties.find((p) => p.id === selectedList)?.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold">
                        Liste:{" "}
                        {customListName || "Leere Liste (ohne Bezeichnung)"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {Array.from({ length: maxSeats }).map((_, lineIndex) => {
                const candidate = ballot[lineIndex];
                return (
                  <div
                    key={lineIndex}
                    className="flex items-center border-b border-gray-300 pb-2"
                  >
                    <span className="w-8 text-gray-500 text-sm">
                      {lineIndex + 1}.
                    </span>
                    {candidate ? (
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded ${
                              parties.find((p) => p.id === candidate.party)
                                ?.color
                            } mr-2`}
                          ></div>
                          <span className="font-medium">{candidate.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            (
                            {
                              parties.find((p) => p.id === candidate.party)
                                ?.name
                            }
                            )
                          </span>
                        </div>
                        <button
                          onClick={() => removeCandidate(lineIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 text-gray-400">
                        _____________________________
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center text-sm">
                <span>
                  Verwendete Stimmen:{" "}
                  {ballot.reduce((sum, c) => sum + c.count, 0)} / {maxSeats}
                </span>
                <span>
                  Leere Linien:{" "}
                  {maxSeats - ballot.reduce((sum, c) => sum + c.count, 0)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowResults(true)}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            disabled={tutorialMode}
          >
            Stimmen berechnen
          </button>

          {tutorialMode && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Die Stimmberechnung ist während des Tutorials deaktiviert.
            </p>
          )}
        </div>
      </div>

      {/* Ergebnisse */}
      {showResults && results && (
        <div className="mt-8 bg-white rounded-lg p-6 border-2 border-gray-300">
          <h2 className="text-2xl font-bold mb-6">Ergebnisse</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Parteistimmen</h3>
              <div className="space-y-2">
                {parties.map((party) => (
                  <div
                    key={party.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded ${party.color} mr-2`}
                      ></div>
                      <span className="font-medium">{party.name}</span>
                    </div>
                    <span className="font-bold text-lg">
                      {results.partyVotes[party.id]} Stimmen
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Kandidatenstimmen</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {parties
                  .flatMap((party) =>
                    party.candidates.map((candidate) => ({
                      ...candidate,
                      votes: results.candidateVotes[candidate.id] || 0,
                      partyColor: party.color,
                    }))
                  )
                  .filter((c) => c.votes > 0)
                  .sort((a, b) => b.votes - a.votes)
                  .map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded ${candidate.partyColor} mr-2`}
                        ></div>
                        <span className="text-sm">{candidate.name}</span>
                      </div>
                      <span className="font-semibold">
                        {candidate.votes}{" "}
                        {candidate.votes === 1 ? "Stimme" : "Stimmen"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Erklärung der Stimmenzählung:
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Jeder gewählte Kandidat erhält eine Kandidatenstimme</li>
              <li>
                • Kandidatenstimmen zählen auch als Parteistimmen für ihre
                jeweilige Partei
              </li>
              {selectedList && selectedList !== "empty" && (
                <li>
                  • Leere Linien auf vorgedruckten Listen werden als
                  Parteistimmen gezählt
                </li>
              )}
              <li>
                • Die Parteistimmen entscheiden über die Sitzverteilung zwischen
                den Parteien
              </li>
              <li>
                • Die Kandidatenstimmen entscheiden, welche Kandidaten innerhalb
                einer Partei gewählt werden
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwissElectionTool;
