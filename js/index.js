let pokemonArray = [];

let firstCard = undefined;
let secondCard = undefined;
let locked = false;

let currentDifficulty = "easy";

let clicks = 0;
let pairsMatched = 0;
let totalPairs = 0;
let pairsLeft = 0;

let timerInterval;
let timeLeft = 0;
let gameOver = true;

let allowedPowerUps = true;

const difficultySettings = {
  easy: { time: 120, pairs: 3 },
  medium: { time: 90, pairs: 6 },
  hard: { time: 60, pairs: 9 }
};

$(document).ready(function () {
  $("#start_button").on("click", startGame);
  $("#reset_button").on("click", resetGame);
  $("#easy_mode").on("click", () => setDifficulty("easy"));
  $("#medium_mode").on("click", () => setDifficulty("medium"));
  $("#hard_mode").on("click", () => setDifficulty("hard"));
  $("#theme").on("click", switchThemes);
  $("#power_up").on("click", powerUp);

  getPokemonPhotos();
});



// Adds in the photos of the pokemon photos
async function getPokemonPhotos() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
  const data = await response.json();

  for (let pokemon of data.results) {
    const pokemonResponse = await fetch(pokemon.url);
    const pokemonData = await pokemonResponse.json();

    const imageUrl = pokemonData.sprites.other["official-artwork"].front_default;

    if (imageUrl) {
      pokemonArray.push({ name: pokemonData.name, image: imageUrl });
    }
  }
  console.log(pokemonArray);
}

//Starts the game
function startGame() {
  gameOver = false;
  resetGame();
  $("#starting_message").text(`The game has started. Good luck!`);
  setup();
  startTimer();
}


// Sets the difficulty level
function setDifficulty(level) {
  currentDifficulty = level;
  $("#easy_mode, #medium_mode, #hard_mode").removeClass("active-difficulty");
  $(`#${level}_mode`).addClass("active-difficulty");
  resetGame();
}



// Resets the game score and cards
function resetGame() {
  if (pokemonArray.length === 0) {
    alert("Pokémon are still loading. Please wait a few seconds and try again.");
    return;
  }
  firstCard = undefined;
  secondCard = undefined;
  locked = false;
  clicks = 0;
  pairsMatched = 0;
  totalPairs = difficultySettings[currentDifficulty].pairs;
  pairsLeft = totalPairs;
  timeLeft = difficultySettings[currentDifficulty].time;
  gameOver = false;
  allowedPowerUps = true;

  $("#power_up").prop("disabled", false).text("Power-Up");

  clearInterval(timerInterval);
  $("#score").text(`Score: ${clicks}`);
  $("#timer").text(`Time: ${timeLeft}s`);
  $("#clicks").text(`Clicks: ${clicks}`);
  $("#num_pairs_left").text(`Pairs Left: ${pairsLeft}`);
  $("#pairs_matched").text(`Pairs Matched: ${pairsMatched}`);
  $("#total_pairs").text(`Total Pairs: ${totalPairs}`);
  $("#starting_message").text(`Click start to find the matching pairs.`);


  let selectedPokemon = shuffle([...pokemonArray]).slice(0, totalPairs);
  let cardData = shuffle([...selectedPokemon, ...selectedPokemon]);

  $("#game_grid").empty();

  $("#game_grid")
    .removeClass("easy-grid medium-grid hard-grid")
    .addClass(`${currentDifficulty}-grid`);

  $("body").addClass("game-started");

  for (let i = 0; i < cardData.length; i++) {
    $("#game_grid").append(`
    <div class="card">
      <img id="card${i}" class="front_face" src="${cardData[i].image}" alt="${cardData[i].name}">
      <img class="back_face" src="images/back.webp" alt="card back">
    </div>
  `);
  }
}




// Fisher-Yates shuffle algorithm
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Switch between light and dark mode
function switchThemes() {
  $("body").toggleClass("dark-mode");
  if ($("body").hasClass("dark-mode")) {
    $("#theme").text("Switch to Light Mode");
  } else {
    $("#theme").text("Switch to Dark Mode");
  }
}


// Start the game timer and update the display every second
function startTimer() {
  timerInterval = setInterval(function () {
    if (timeLeft > 0) {
      timeLeft--;
      $("#timer").text(`Time: ${timeLeft}s`);
    } else {
      endGame(false);
    }
  }, 1000);
}


// Use a power-up to briefly reveal all cards and help the player find matches
function powerUp() {
  if (gameOver || !allowedPowerUps || locked) return;

  if ($(".card").length === 0) return;

  allowedPowerUps = false;
  locked = true;
  $("#power_up").prop("disabled", true).text("Power-Up Used");

  // Flip all cards face up for 2 seconds
  $(".card").addClass("flip");

  setTimeout(function () {
    // $(".card").not(function () {
    //   return $(this).off;
    // });
    $(".card").each(function () {
      if (!$(this).data("matched")) {
        $(this).removeClass("flip");
      }
    });

    firstCard = undefined;
    secondCard = undefined;
    locked = false;
  }, 2000);
}


// Check if the player has won after each successful match
function winCheck() {
  if (pairsMatched === totalPairs) {
    endGame(true);
  }
}


// Ends the game and shows a message based on whether the player won or lost
function endGame(playerWon) {
  $("body").removeClass("game-started");

  gameOver = true;
  locked = true;
  clearInterval(timerInterval);

  if (playerWon) {
    $("#starting_message").text(`Congratulations! You won with ${clicks} clicks and ${timeLeft} seconds remaining!`);
  }
  else {
    $("#starting_message").text("Game Over! You've run out of time!");
  }
}



// Set up click handlers for the cards
function setup() {

  $(".card").off("click");

  $(".card").on(("click"), function () {
    if (gameOver) return;
    if (locked) return;

    if ($(this).hasClass("flip")) return;

    $(this).addClass("flip");

    clicks++;
    $("#clicks").text(`Clicks: ${clicks}`);

    if (!firstCard)
      firstCard = $(this).find(".front_face")[0]
    else {
      secondCard = $(this).find(".front_face")[0]
      console.log(firstCard, secondCard);

      if (firstCard.src == secondCard.src
        && firstCard.id != secondCard.id) {
        console.log("match");

        $(`#${firstCard.id}`).parent().data("matched", true);
        $(`#${secondCard.id}`).parent().data("matched", true);

        $(`#${firstCard.id}`).parent().off("click");
        $(`#${secondCard.id}`).parent().off("click");

        pairsMatched++;
        pairsLeft--;

        $("#pairs_matched").text(`Pairs Matched: ${pairsMatched}`);
        $("#num_pairs_left").text(`Pairs Left: ${pairsLeft}`);

        firstCard = undefined;
        secondCard = undefined;

        winCheck();

      } else {
        console.log("no match");
        locked = true;

        let tempFirstCard = firstCard;
        let tempSecondCard = secondCard;

        setTimeout(() => {
          $(`#${tempFirstCard.id}`).parent().removeClass("flip");
          $(`#${tempSecondCard.id}`).parent().removeClass("flip");

          firstCard = undefined;
          secondCard = undefined;

          locked = false;
        }, 1000)
      }
    }
  });
}
