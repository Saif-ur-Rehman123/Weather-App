const apiKey = '7462b15996ca432dcea7e0a733e8b48f'; // OpenWeather API key for weather button
const geminiApiKey = 'AIzaSyDeT1G2yuDnC3EDry6BN6F4ODokpkaEkeM'; // Gemini API key
const getWeatherBtn = document.querySelector('.get-weather-btn');
const forecastTableBody = document.getElementById('forecastBody');
const pagination = document.getElementById('pagination');
const searchBar = document.querySelector('.search-bar');
const chatInput = document.querySelector('.chat-input');
const sendBtn = document.querySelector('.send-btn');
const answerArea = document.querySelector('.answer-area');
const units = 'metric'; // Celsius

let currentPage = 1;
const entriesPerPage = 10;
let originalForecastData = [];
let filteredForecastData = [];

getWeatherBtn.addEventListener('click', fetchWeather);
sendBtn.addEventListener('click', handleChatQuery);

// Fetch the weather data for the table
async function fetchWeather() {
    const city = searchBar.value;
    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    try {
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`);
        if (!forecastResponse.ok) {
            throw new Error('Unable to fetch forecast data');
        }
        const forecastData = await forecastResponse.json();
        originalForecastData = forecastData.list;
        filteredForecastData = [...originalForecastData];
        displayForecast();
    } catch (error) {
        alert(error.message);
    }
}

// Display forecast data in a table
function displayForecast() {
    const totalEntries = filteredForecastData.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    renderForecastEntries(currentPage);
    setupPagination(totalPages);
}

// Render forecast entries for the current page
function renderForecastEntries(page) {
    const start = (page - 1) * entriesPerPage;
    const end = start + entriesPerPage;
    const entriesToDisplay = filteredForecastData.slice(start, end);
    forecastTableBody.innerHTML = '';

    entriesToDisplay.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        const temperature = forecast.main.temp.toFixed(1);
        const conditions = forecast.weather[0].description;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${temperature} °C</td>
            <td>${conditions}</td>
        `;
        forecastTableBody.appendChild(row);
    });
}

// Set up pagination buttons
function setupPagination(totalPages) {
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.classList.add('pagination-btn');
        button.addEventListener('click', () => {
            currentPage = i;
            renderForecastEntries(currentPage);
        });
        pagination.appendChild(button);
    }
}

// Filter functionality for forecast data
document.getElementById('applyFilterBtn').addEventListener('click', applyFilter);

function applyFilter() {
    const sortSelect = document.getElementById('sortSelect');
    const selectedOption = sortSelect.value;

    filteredForecastData = [...originalForecastData];

    if (selectedOption === "asc") {
        filteredForecastData.sort((a, b) => a.main.temp - b.main.temp);
    } else if (selectedOption === "desc") {
        filteredForecastData.sort((a, b) => b.main.temp - a.main.temp);
    } else if (selectedOption === "rain") {
        filteredForecastData = filteredForecastData.filter(forecast =>
            forecast.weather.some(condition => condition.description.includes('rain'))
        );
    } else if (selectedOption === "highest") {
        const highestTempForecast = filteredForecastData.reduce((prev, current) => {
            return (prev.main.temp > current.main.temp) ? prev : current;
        });
        filteredForecastData = [highestTempForecast];
    }

    currentPage = 1;
    displayForecast();
}
async function handleChatQuery() {
    const userQuery = chatInput.value.trim();
    if (!userQuery) return;

    answerArea.innerHTML = ''; // Clear previous response

    // Prepare data to be sent to Gemini
    const dataToSend = {
        contents: [
            {
                parts: [
                    { text: userQuery }
                ]
            }
        ]
    };

    // Check if the query is weather-related
    if (userQuery.toLowerCase().includes("weather")) {
        // Extract the city name from the query
        const cityMatch = userQuery.match(/(?:in|for)\s+([a-zA-Z\s]+)/i);
        const city = cityMatch ? cityMatch[1].trim() : null; // Get the city name after "in" or "for"

        if (!city) {
            displayBotResponse("Please specify a city to get the weather information.");
            return;
        }

        // Fetch weather data from OpenWeather
        try {
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
            if (!forecastResponse.ok) {
                throw new Error('Unable to fetch weather data for ' + city);
            }
            const weatherData = await forecastResponse.json();
            const temperature = weatherData.main.temp.toFixed(1);
            const conditions = weatherData.weather[0].description;

            const weatherResponse = `The current weather in ${city} is ${temperature} °C with ${conditions}.`;
            displayBotResponse(weatherResponse);
            return; // Stop further processing since we handled the response
        } catch (error) {
            displayBotResponse("I'm unable to fetch the weather information right now for " + city + ".");
            console.error(error);
            return;
        }
    }

    // Check if the user is asking about the filled table data
    if (userQuery.toLowerCase().includes("highest temperature")) {
        if (originalForecastData.length === 0) {
            displayBotResponse("The weather data table is empty. Please fetch the weather data first.");
            return;
        }

        const highestTempForecast = originalForecastData.reduce((prev, current) => {
            return (prev.main.temp > current.main.temp) ? prev : current;
        });

        const highestTemperature = highestTempForecast.main.temp.toFixed(1);
        const date = new Date(highestTempForecast.dt * 1000).toLocaleDateString();
        displayBotResponse(`The highest temperature recorded in the table is ${highestTemperature} °C on ${date}.`);
        return;
    }

    if (userQuery.toLowerCase().includes("average temperature")) {
        if (originalForecastData.length === 0) {
            displayBotResponse("The weather data table is empty. Please fetch the weather data first.");
            return;
        }

        const totalTemperature = originalForecastData.reduce((sum, forecast) => sum + forecast.main.temp, 0);
        const averageTemperature = (totalTemperature / originalForecastData.length).toFixed(1);
        displayBotResponse(`The average temperature in the table is ${averageTemperature} °C.`);
        return;
    }

    // Proceed with Gemini API if it's not a weather-related query or table-related query
    try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });

        // Check if the response is okay
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('Gemini API Error:', errorData); // Log the error response
            throw new Error('Unable to process your request.');
        }

        // Log the entire response for debugging
        const geminiData = await geminiResponse.json();
        console.log('Gemini API Response:', geminiData); // Log the response to inspect it

        // Access the expected response structure
        if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
            const responseText = geminiData.candidates[0].content.parts[0].text || "I'm unable to find an answer for that.";
            displayBotResponse(responseText);
        } else {
            console.warn("Response structure is not as expected:", geminiData);
            displayBotResponse("I'm unable to find an answer for that.");
        }

    } catch (error) {
        console.error('Error:', error.message); // Log the error message
        displayBotResponse("I'm unable to find an answer for that.");
    }
}



// Display chatbot response
function displayBotResponse(response) {
    const responseElement = document.createElement('p');
    responseElement.textContent = response;
    answerArea.appendChild(responseElement);
}
