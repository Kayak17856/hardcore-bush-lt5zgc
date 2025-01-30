import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "./styles.css";
import "font-awesome/css/font-awesome.min.css"; // Import FontAwesome for icons

function App() {
  const [setName, setSetName] = useState("");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [editCardIndex, setEditCardIndex] = useState(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load flashcard sets from localStorage when the app starts
  useEffect(() => {
    const savedFlashcards = localStorage.getItem("flashcardSets");
    if (savedFlashcards) {
      setFlashcardSets(JSON.parse(savedFlashcards));
    }
  }, []);

  // Save flashcard sets to localStorage whenever they change
  useEffect(() => {
    if (flashcardSets.length > 0) {
      localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));
    }
  }, [flashcardSets]);

  const handleAddSet = () => {
    if (setName.trim()) {
      setFlashcardSets([...flashcardSets, { name: setName, cards: [] }]);
      setSetName("");
    }
  };

  // Utility to check word count
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const handleAddCard = () => {
    if (
      getWordCount(frontText) <= 80 &&
      getWordCount(backText) <= 80 &&
      activeSet !== null
    ) {
      const truncatedFront =
        getWordCount(frontText) > 80
          ? frontText.split(/\s+/).slice(0, 80).join(" ") + "..."
          : frontText;
      const truncatedBack =
        getWordCount(backText) > 80
          ? backText.split(/\s+/).slice(0, 80).join(" ") + "..."
          : backText;

      const updatedSets = [...flashcardSets];
      updatedSets[activeSet].cards.push({
        front: truncatedFront,
        back: truncatedBack,
      });
      setFlashcardSets(updatedSets);
      setFrontText("");
      setBackText("");
    }
  };

  const handleStartStudy = () => {
    if (activeSet !== null && flashcardSets[activeSet].cards.length > 0) {
      setStudyMode(true);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      shuffleCards();
    }
  };

  const shuffleCards = () => {
    const updatedSets = [...flashcardSets];
    updatedSets[activeSet].cards = updatedSets[activeSet].cards.sort(
      () => Math.random() - 0.5
    );
    setFlashcardSets(updatedSets);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcardSets[activeSet].cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      setStudyMode(false);
    }
  };

  // Handle PDF generation and printing
  const handlePrintPDF = () => {
    const doc = new jsPDF();
    const flashcards = flashcardSets[activeSet]?.cards || [];

    const cardWidth = 95;
    const cardHeight = 55;

    const margin = 5;

    const maxCardsPerPage = 8;

    const verticalSpacing = 5;
    const horizontalSpacing = 5;

    doc.setFontSize(12);

    const availableWidth = doc.internal.pageSize.width - 2 * margin;
    const startX = (availableWidth - (cardWidth * 2 + horizontalSpacing)) / 2;

    let currentY = margin;
    let currentX = startX;
    let cardCount = 0;

    flashcards.forEach((card) => {
      const backTextLines = doc.splitTextToSize(card.back, cardWidth - 4);

      let yOffset = currentY + (cardHeight - backTextLines.length * 6) / 2;

      backTextLines.forEach((line, index) => {
        const textWidth = doc.getTextWidth(line);
        const xOffset = currentX + (cardWidth - textWidth) / 2;
        doc.text(line, xOffset, yOffset + index * 6);
      });

      doc.setLineWidth(0.5);
      doc.rect(currentX, currentY, cardWidth, cardHeight);

      cardCount++;

      if (cardCount % maxCardsPerPage === 0) {
        doc.addPage();
        currentY = margin;
        currentX = startX;
      } else {
        if (cardCount % 2 === 0) {
          currentX = startX;
          currentY += cardHeight + verticalSpacing;
        } else {
          currentX += cardWidth + horizontalSpacing;
        }
      }
    });

    doc.save("flashcards.pdf");
  };

  // Handle Deleting a Set
  const handleDeleteSet = (index) => {
    const updatedSets = flashcardSets.filter((_, i) => i !== index);
    setFlashcardSets(updatedSets);
  };

  // Handle Deleting a Card
  const handleDeleteCard = (cardIndex) => {
    const updatedSets = [...flashcardSets];
    updatedSets[activeSet].cards = updatedSets[activeSet].cards.filter(
      (_, i) => i !== cardIndex
    );
    setFlashcardSets(updatedSets);
  };

  // Handle Editing a Card
  const handleEditCard = (cardIndex) => {
    const card = flashcardSets[activeSet].cards[cardIndex];
    setFrontText(card.front);
    setBackText(card.back);
    setEditCardIndex(cardIndex); // Track which card is being edited
  };

  // Handle Updating an Edited Card
  const handleUpdateCard = () => {
    if (editCardIndex !== null) {
      const updatedSets = [...flashcardSets];
      updatedSets[activeSet].cards[editCardIndex] = {
        front: frontText,
        back: backText,
      };
      setFlashcardSets(updatedSets);
      setFrontText("");
      setBackText("");
      setEditCardIndex(null);
    }
  };

  return (
    <div className="App">
      <h1>Flashcard App</h1>

      <div className="set-creation">
        <input
          type="text"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          placeholder="Enter set name"
        />
        <button onClick={handleAddSet}>Add Set</button>
      </div>

      <div className="set-list">
        {flashcardSets.length === 0 ? (
          <p>No flashcard sets yet!</p>
        ) : (
          flashcardSets.map((set, index) => (
            <div
              key={index}
              onClick={() => setActiveSet(index)}
              className={`set-item ${activeSet === index ? "active" : ""}`}
            >
              {set.name} ({set.cards.length} cards)
              <button
                className="delete-set-btn"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering set click when deleting
                  handleDeleteSet(index);
                }}
              >
                <i className="fa fa-trash"></i> {/* Trash icon */}
              </button>
            </div>
          ))
        )}
      </div>

      {activeSet !== null && !studyMode && editCardIndex === null && (
        <div className="card-creation">
          <input
            type="text"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            placeholder="Front text (max 80 words)"
          />
          <input
            type="text"
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
            placeholder="Back text (max 80 words)"
          />
          <button onClick={handleAddCard}>Add Card</button>
        </div>
      )}

      {activeSet !== null &&
        !studyMode &&
        flashcardSets[activeSet]?.cards.length > 0 && (
          <div className="flashcard-list">
            <h3>Flashcards in Set: {flashcardSets[activeSet].name}</h3>
            <button onClick={handleStartStudy}>Start Study</button>
            <button onClick={handlePrintPDF}>Print Flashcards</button>
            <div>
              {flashcardSets[activeSet].cards.map((card, index) => (
                <div key={index} className="flashcard-item">
                  <div>{card.front}</div>
                  <div>{card.back}</div>
                  <button onClick={() => handleEditCard(index)}>Edit</button>
                  <button onClick={() => handleDeleteCard(index)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Edit Card */}
      {editCardIndex !== null && !studyMode && (
        <div className="edit-card">
          <h3>Edit Card</h3>
          <input
            type="text"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            placeholder="Edit front text"
          />
          <input
            type="text"
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
            placeholder="Edit back text"
          />
          <button onClick={handleUpdateCard}>Update Card</button>
        </div>
      )}

      {/* Study Mode */}
      {studyMode && flashcardSets[activeSet]?.cards[currentCardIndex] && (
        <div className="study-mode">
          <h3>Study Mode - {flashcardSets[activeSet]?.name}</h3>
          <div className="flashcard">
            <div className="card-content">
              <div className="card-text">
                {isFlipped
                  ? flashcardSets[activeSet]?.cards[currentCardIndex].back
                  : flashcardSets[activeSet]?.cards[currentCardIndex].front}
              </div>
              <button onClick={handleFlipCard}>
                {isFlipped ? "Show Front" : "Show Back"}
              </button>
            </div>
          </div>
          <button onClick={handleNextCard}>
            {currentCardIndex < flashcardSets[activeSet].cards.length - 1
              ? "Next Card"
              : "Finish Study"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
