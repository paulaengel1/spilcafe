"use strict";

// ===== APP INITIALISERING =====
// Start app når DOM er loaded (hele HTML siden er færdig med at indlæse)
document.addEventListener("DOMContentLoaded", initApp);

// Global variabel til alle film - tilgængelig for alle funktioner
let allGames = [];

const specialImageNames = {
  "7 Wonders": "7wonders",
  "Stratego": "strategy",
  "Ticket to Ride: Europe": "ticket-to-ride"
};

function getLocalImage(game) {
  const imageName =
    specialImageNames[game.title] ||
    game.title
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll("æ", "ae")
      .replaceAll("ø", "oe")
      .replaceAll("å", "aa");

  return `img/${imageName}.webp`;
}

// #1: Initialize the app - sæt event listeners og hent data
function initApp() {
  getGames(); // Hent film data fra JSON fil

  document
    .querySelector("#search-input")
    .addEventListener("input", filterGames);
  document
    .querySelector("#genre-select1")
    .addEventListener("change", filterGames);
  document
    .querySelector("#genre-select2")
    .addEventListener("change", filterGames);
  document
    .querySelector("#players-select")
    .addEventListener("change", filterGames);
  document
    .querySelector("#clear-filters")
    .addEventListener("click", clearAllFilters);
}

async function getGames() {
  // Hent data fra URL - await venter på svar før vi går videre
  let response = await fetch(
    "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json"
  );

  allGames = await response.json();

  populateGenreDropdown(); // Udfyld dropdown med genrer fra data
  displayGames(allGames); // Vis alle film ved start
}

// #4: Render a single game card and add event listeners - lav et spil kort
function displayGame(game) {
  const gameList = document.querySelector("#game-list"); // Find container til film

  // Byg HTML struktur dynamisk - template literal med ${} til at indsætte data
  const gameHTML = `
  <article class="game-card">
    <img
      src="${getLocalImage(game)}"
      alt="Forside af brætspillet ${game.title}"
      class="game-poster"
      width="400"
      height="400"
      loading="lazy"
    />

    <div class="game-info">
      <h3>${game.title}</h3>
      <p class="game-rating">⭐ ${game.rating}</p>
      <p class="game-playtime">Ca. ${game.playtime} min.</p>
      <p class="game-players">${game.players.min} - ${game.players.max} spillere</p>
      <p class="game-genre">${game.genre}</p>

      <button
        type="button"
        class="game-details-btn"
        aria-haspopup="dialog"
      >
        Se mere om ${game.title}
      </button>
    </div>
  </article>`;

  // Tilføj game card til DOM (HTML) - insertAdjacentHTML sætter HTML ind uden at overskrive
  gameList.insertAdjacentHTML("beforeend", gameHTML);

  // Find det kort vi lige har tilføjet (det sidste element)
  const newCard = gameList.lastElementChild;
  const detailsButton = newCard.querySelector(".game-details-btn");
  
  // Åbn dialogen via den semantiske knap
  detailsButton.addEventListener("click", function (event) {
    event.stopPropagation();
    showGameModal(game);
  });
  
  // Bevar muligheden for at klikke på hele kortet med mus
  newCard.addEventListener("click", function () {
    showGameModal(game);
  });
}

// ===== DROPDOWN OG MODAL FUNKTIONER =====
// #5: Udfyld genre-dropdown med alle unikke genrer fra data
function populateGenreDropdown() {
  // Players dropdown
  const playersSelect = document.querySelector("#players-select");
  const playerCounts = new Set();
  for (const game of allGames) {
    if (
      game.players &&
      typeof game.players.min === "number" &&
      typeof game.players.max === "number"
    ) {
      for (let i = game.players.min; i <= game.players.max; i++) {
        playerCounts.add(i);
      }
    }
  }
  const sortedPlayers = Array.from(playerCounts).sort((a, b) => a - b);
  playersSelect.innerHTML = '<option value="all">Antal spillere</option>';
  sortedPlayers.forEach((num) => {
    playersSelect.innerHTML += `<option value="${num}">${num} spillere</option>`;
  });
  // Genre dropdown
  const genreSelect = document.querySelector("#genre-select1");
  const genres = new Set();
  for (const game of allGames) {
    if (game.genre) genres.add(game.genre);
  }
  genreSelect.innerHTML = '<option value="all">Kategori</option>';
  genres.forEach((genre) => {
    genreSelect.innerHTML += `<option value="${genre}">${genre}</option>`;
  });

  // Playtime dropdown
  const playtimeSelect = document.querySelector("#genre-select2");
  const playtimes = new Set();
  for (const game of allGames) {
    if (game.playtime) playtimes.add(game.playtime);
  }
  // Sort playtimes numerically
  const sortedPlaytimes = Array.from(playtimes).sort((a, b) => a - b);
  playtimeSelect.innerHTML = '<option value="all">Varighed</option>';
  sortedPlaytimes.forEach((time) => {
    playtimeSelect.innerHTML += `<option value="${time}">${time} min.</option>`;
  });
}

// #6: Vis game i modal dialog - popup vindue med spil detaljer
function showGameModal(game) {
  // Find modal indhold container og byg HTML struktur dynamisk
  document.querySelector("#dialog-content").innerHTML = /*html*/ `
 <img
  src="${getLocalImage(game)}"
  alt="Forside af brætspillet ${game.title}"
  class="game-poster"
  width="400"
  height="400"
/>
    <div class="dialog-details">
<h2 id="dialog-title">${game.title}</h2>

<p class="game-genre">${
  Array.isArray(game.genre) ? game.genre.join(", ") : game.genre || ""
}</p>
      <p class="game-rating">⭐ ${game.rating}</p>
      <p class="game-description">${game.description}</p>
    </div>
  `;

  // Åbn modalen - showModal() er en built-in browser funktion
  document.querySelector("#game-dialog").showModal();
}

// ===== FILTER FUNKTIONER =====
// #7: Ryd alle filtre - reset alle filter felter til tomme værdier
function clearAllFilters() {
  // Ryd alle input felter - sæt value til tom string eller standard værdi
  document.querySelector("#search-input").value = "";
  document.querySelector("#players-select").value = "all";
  document.querySelector("#genre-select2").value = "all";
  document.querySelector("#genre-select1").value = "all";
  // Hvis du har flere filtre, tilføj dem her

  // Kør filtrering igen (vil vise alle film da alle filtre er ryddet)
  filterGames();
}

// #8: Komplet filtrering med alle funktioner - den vigtigste funktion!
function filterGames() {
  // Hent alle filter værdier fra input felterne
  const searchValue = document
    .querySelector("#search-input")
    .value.toLowerCase();
  const genre1Value = document.querySelector("#genre-select1").value;
  const genre2Value = document.querySelector("#genre-select2").value;
  const playersValue = document.querySelector("#players-select")?.value;

  let filteredGames = allGames;

  // FILTER 1: Søgetekst - filtrer på spil titel
  if (searchValue) {
    filteredGames = filteredGames.filter((game) =>
      game.title.toLowerCase().includes(searchValue)
    );
  }

  // FILTER 2: Genre 1 - filtrer på valgt genre (string match)
  if (genre1Value !== "all") {
    filteredGames = filteredGames.filter((game) => game.genre === genre1Value);
  }

  // FILTER 3: Genre 2 - filtrer på valgt varighed (playtime in minutes)
  if (genre2Value !== "all") {
    filteredGames = filteredGames.filter(
      (game) => String(game.playtime) === genre2Value
    );
  }

  // FILTER 4: Players
  if (playersValue && playersValue !== "all") {
    const num = Number(playersValue);
    filteredGames = filteredGames.filter(
      (game) =>
        game.players && num >= game.players.min && num <= game.players.max
    );
  }

  displayGames(filteredGames);
}

// RENDER GAME LIST (called after filtering or loading data)
function displayGames(games) {
  const gameList = document.querySelector("#game-list");
  gameList.innerHTML = "";
  if (!games || games.length === 0) {
    gameList.innerHTML =
      '<p class="no-results">Ingen spil matchede dine filtre </p>';
    return;
  }
  for (const game of games) {
    displayGame(game);
  }
}
