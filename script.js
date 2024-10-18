const apiKey = '7462b15996ca432dcea7e0a733e8b48f'; // Replace with your OpenWeather API key
const getWeatherBtn = document.getElementById('getWeatherBtn');
const weatherDataDiv = document.getElementById('weatherData');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastDiv = document.getElementById('forecast');
const forecastTableBody = document.getElementById('forecastBody');
const searchBar = document.querySelector('.search-bar');
const pagination = document.getElementById('pagination');
const units = 'metric'; // Change to 'imperial' for Fahrenheit

let verticalBarChart;
let doughnutChart;
let lineChart;

function destroyCharts() {
    if (verticalBarChart) {
        verticalBarChart.destroy();
    }
    if (doughnutChart) {
        doughnutChart.destroy();
    }
    if (lineChart) {
        lineChart.destroy();
    }
}


getWeatherBtn.addEventListener('click', fetchWeather);

async function fetchWeather() {
    const city = searchBar.value;
    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    try {
        // Fetch current weather data
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }
        const weatherData = await weatherResponse.json();
        displayCurrentWeather(weatherData);

        // Fetch 5-day forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`);
        if (!forecastResponse.ok) {
            throw new Error('Unable to fetch forecast data');
        }
        const forecastData = await forecastResponse.json();
        displayForecast(forecastData);
        updateCharts(forecastData);  // Update the charts dynamically
    } catch (error) {
        alert(error.message); // Display error message to user
    }
}

function displayCurrentWeather(data) {
    const { name, main, wind, weather } = data;
    const temperature = main.temp.toFixed(1); // Format temperature
    const humidity = main.humidity;
    const windSpeed = wind.speed;
    const weatherDescription = weather[0].description;
    const weatherIcon = `http://openweathermap.org/img/wn/${weather[0].icon}.png`;

    currentWeatherDiv.innerHTML = `
    <h3>${name}</h3>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <p>
            Temperature: ${temperature} °C&nbsp;&nbsp;&nbsp;
            Humidity: ${humidity}%&nbsp;&nbsp;&nbsp;
            Wind Speed: ${windSpeed} m/s&nbsp;&nbsp;&nbsp;
            Description: ${weatherDescription}
        </p>
        <img src="${weatherIcon}" alt="${weatherDescription}" style="width: 100px; height: auto;"> <!-- Adjust width as needed -->
    </div>
`;

}

function displayForecast(data) {
    
    forecastDiv.innerHTML = '';  // Clear previous forecast data

    const forecastList = data.list;

    // Group forecast by day
    const dailyForecast = {};
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        if (!dailyForecast[date]) {
            dailyForecast[date] = [];
        }
        dailyForecast[date].push(forecast);
    });

    // Display forecast data for each day
    for (const date in dailyForecast) {
        const dailyData = dailyForecast[date];
        const averageTemp = dailyData.reduce((acc, cur) => acc + cur.main.temp, 0) / dailyData.length;

        forecastDiv.innerHTML += `
            <div class="forecast-day">
                <h4>${date}</h4>
                <p>Average Temperature: ${averageTemp.toFixed(1)} °C</p>
                <p>Conditions: ${dailyData[0].weather[0].description}</p>
            </div>
        `;
    }
}
function updateCharts(forecastData) {
    const forecastList = forecastData.list;

    const labels = forecastList.map(forecast => new Date(forecast.dt * 1000).toLocaleDateString());
    const temperatures = forecastList.map(forecast => forecast.main.temp);
    const weatherConditions = forecastList.map(forecast => forecast.weather[0].main); // Get weather conditions

    // Calculate the percentage of weather conditions for Doughnut Chart
    const conditionCounts = {};
    weatherConditions.forEach(condition => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });

    const conditionLabels = Object.keys(conditionCounts);
    const conditionData = Object.values(conditionCounts);

    // Ensure the chart context is set correctly
    const barCtx = document.getElementById('vertical-bar').getContext('2d');
    const doughnutCtx = document.getElementById('doughnut-chart').getContext('2d');
    const lineCtx = document.getElementById('line-chart').getContext('2d');

    // Destroy existing charts to avoid conflicts
    destroyCharts();

    // Create bar chart
    verticalBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Days'
                    }
                }
            }
        }
    });

    // Create doughnut chart
    doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: conditionLabels,
            datasets: [{
                label: 'Weather Conditions',
                data: conditionData,
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Weather Conditions Distribution'
                }
            }
        }
    });

    // Create line chart
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Temperature Change Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Days'
                    }
                }
            }
        }
    });
}



