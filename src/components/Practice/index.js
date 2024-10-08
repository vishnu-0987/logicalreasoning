import { useEffect, useState } from "react";
import topicsData from "../../topicsData";
import quantitativeTopic from "../../quantitativeTopic";
import "./index.css";
import Pagination from "../Pagination";

const Practice = (props) => {
  const { topic, main } = props;
  let jsonData;
  if (main === "logical") {
    jsonData = topicsData[topic];
  } else {
    jsonData = quantitativeTopic[topic];
  }

  const { practiceQuestions } = jsonData;
  const [practiceModels, setPracticeModels] = useState([]);
  const [isWorkSpace, setWorkSpace] = useState({});
  const [selectedOpt, setSelectedOpt] = useState({});
  const [submittedOpt, setSubmittedOpt] = useState({});
  const [errMsg, setErrMsg] = useState({});
  const [view, setView] = useState({});
  const [isSubmitted, setIsSubmitted] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;

  const toggleWorkSpace = (id) => {
    setWorkSpace((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const changeOption = (id, opt) => {
    if (selectedOpt[id] === opt) {
      setSelectedOpt((prev) => ({
        ...prev,
        [id]: false,
      }));
    } else {
      setSelectedOpt((prev) => ({
        ...prev,
        [id]: opt,
      }));
    }
    // Reset the submission status when a new option is selected
    setSubmittedOpt((prev) => ({
      ...prev,
      [id]: false,
    }));
  };

  const submitButton = (id, corr) => {
    setIsSubmitted((prev) => ({
      ...prev,
      [id]: !prev.id,
    }));
    if (selectedOpt[id]) {
      setErrMsg((prev) => ({
        ...prev,
        [id]: false,
      }));
      setSubmittedOpt((prev) => ({
        ...prev,
        [id]: selectedOpt[id] === corr ? "correct" : "incorrect",
      }));
    } else {
      setErrMsg((prev) => ({
        ...prev,
        [id]: true,
      }));
    }
  };

  const viewAnswer = (id) => {
    if (view[id] === true) {
      setView((prev) => ({
        ...prev,
        [id]: false,
      }));
    } else {
      setView((prev) => ({
        ...prev,
        [id]: true,
      }));
    }
  };

  useEffect(() => {
    window.scroll(0, 250);
  }, [currentPage]);

  useEffect(() => {
    function getRandomValue(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomEvenValue(min, max) {
      let value;
      do {
        value = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (value % 2 !== 0); // Repeat until an even number is generated
      return value;
    }

    function generateQuestion(template, limits) {
      let question = template;
      const values = {};
      for (let [key, limit] of Object.entries(limits)) {
        let value;
        if (key === "product") {
          // Ensure the product is an even number
          value = getRandomEvenValue(limit[0], limit[1]);
        } else if (Array.isArray(limit) && typeof limit[0] === "number") {
          // Handle numerical ranges
          value = getRandomValue(limit[0], limit[1]);
        } else {
          // Handle array of strings
          value = limit[Math.floor(Math.random() * limit.length)];
        }
        values[key] = value;
        const regex = new RegExp(`{{${key}}}`, "g");
        question = question.replace(regex, value);
      }
      return { question, values };
    }

    function evaluateFormula(formula, values) {
      for (let [key, value] of Object.entries(values)) {
        if (value === "__") {
          return "__"; // Skip calculation if the value is a blank
        }
        const regex = new RegExp(key, "g");
        formula = formula.replace(regex, value);
      }
      return Math.round(eval(formula));
    }

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
      }
      return array;
    }

    function replacePlaceholders(template, values, correctAnswer) {
      let result = template.replace(/{{final_answer}}/g, correctAnswer);
      result = result.replace(/{{(.*?)}}/g, (_, key) => values[key] || "");
      return result;
    }

    function generateUniqueOptions(formulaList, values, correctAnswer) {
      console.log(correctAnswer);
      const optionsSet = new Set();
      const options = [];

      // Add the correct answer first
      optionsSet.add(correctAnswer);
      options.push(correctAnswer);
      // console.log("vishnu");

      // Generate other options
      for (let formula of formulaList) {
        const option = evaluateFormula(formula, values);
        // Ensure options are unique and non-negative
        if (option >= 0 && !optionsSet.has(option)) {
          optionsSet.add(option);
          options.push(option);
        }
      }

      // Ensure we have enough unique options
      while (options.length < formulaList.length) {
        const randomOption = Math.floor(
          Math.abs(Math.random() * correctAnswer)
        );
        console.log(randomOption);
        if (!optionsSet.has(randomOption)) {
          optionsSet.add(randomOption);
          options.push(randomOption);
        }
      }

      return shuffleArray(options);
    }

    if (main === "aptitude") {
      //console.log(jsonData);
      const generatedQuestions = practiceQuestions
        .map((q) => {
          const questions = [];
          for (let i = 1; i <= 3; i++) {
            let correctAnswer;
            let questionData;

            // Keep generating questions until we get a positive answer
            do {
              questionData = generateQuestion(q.template, q.limits);
              correctAnswer = evaluateFormula(
                q.correctAnswerFormula,
                questionData.values
              );
            } while (correctAnswer === null || correctAnswer <= 0);

            const { question, values } = questionData;

            const options = generateUniqueOptions(
              q.optionsFormula,
              values,
              correctAnswer
            );

            const explanation = replacePlaceholders(
              q.explanationTemplate,
              values,
              correctAnswer
            );

            questions.push({
              id: `${q.id}-${i}`,
              question: question,
              options: options,
              correctAnswer: correctAnswer,
              explanation: explanation,
            });
          }
          return questions;
        })
        .flat();

      setPracticeModels(generatedQuestions);
    } else {
      setPracticeModels(practiceQuestions);
    }
  }, [topic]);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = practiceModels.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="practice-container">
      <h1>Practice Questions</h1>
      {currentQuestions.map((item, index) => (
        <div className="each-question" key={item.id}>
          <p>
            Question {index + 1 + indexOfFirstQuestion} of{" "}
            {practiceModels.length}
          </p>
          <h3>{item.question}</h3>
          <div className="option-grid">
            {item.options.map((opt, index) => (
              <button
                key={index}
                className={`opt-btn ${
                  selectedOpt[item.id] === opt ? "opt-sel" : ""
                } ${
                  submittedOpt[item.id] &&
                  selectedOpt[item.id] === opt &&
                  (submittedOpt[item.id] === "correct"
                    ? "correct"
                    : "incorrect")
                } ${
                  view[item.id] && opt === item.correctAnswer
                    ? "correct"
                    : "opt-btn"
                }`}
                type="button"
                onClick={() => changeOption(item.id, opt)}
                disabled={isSubmitted[item.id]}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="button-group">
            <button
              type="submit"
              id="submit"
              onClick={() => submitButton(item.id, item.correctAnswer)}
            >
              Submit
            </button>

            <button
              type="submit"
              id={view[item.id] ? "hide" : "answer"}
              onClick={() => viewAnswer(item.id)}
            >
              {view[item.id] ? "Hide Answer" : "View Answer"}
            </button>
            <button
              type="button"
              id="workspace"
              onClick={() => toggleWorkSpace(item.id)}
            >
              Workspace
            </button>
          </div>
          {errMsg[item.id] && (
            <p style={{ color: "red", fontSize: "13px" }}>
              *Please select an option
            </p>
          )}

          {isWorkSpace[item.id] && (
            <textarea rows={15} className="textarea"></textarea>
          )}

          {view[item.id] && (
            <div
              className="explanation"
              dangerouslySetInnerHTML={{ __html: item.explanation }}
            ></div>
          )}
        </div>
      ))}
      <Pagination
        questionsPerPage={questionsPerPage}
        totalQuestions={practiceModels.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
};

export default Practice;
