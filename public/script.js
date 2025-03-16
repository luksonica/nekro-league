// Constants
const images = document.querySelectorAll('.image-gallery img');
const screens = document.querySelectorAll('.screen-gallery img');
const modal = document.getElementById('myModal');
const modalImage = document.getElementById('modalImage');
let currentSortColumn = null;
let isAscending = true;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQSPphqNP7BHzbRXLYDwrkUsPyIJpcALc",
  authDomain: "nekro-league-9e7bf.firebaseapp.com",
  projectId: "nekro-league-9e7bf",
  storageBucket: "nekro-league-9e7bf.firebasestorage.app",
  messagingSenderId: "721371342919",
  appId: "1:721371342919:web:217f325dadb42db4a8e962",
  measurementId: "G-0NCFK58SMN"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics(app);

// Log Firebase initialization
console.log("Firebase initialized:", app);

// Modal Functionality
images.forEach(image => {
  image.addEventListener('click', () => {
    modal.classList.add('show');
    modalImage.src = image.src;
  });
});

screens.forEach(screen => {
  screen.addEventListener('click', () => {
    modal.classList.add('show');
    modalImage.src = screen.src;
  });
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

function closeModal() {
  modal.classList.remove('show');
}

// Toggle Gallery Functionality
function toggleGallery(logo) {
  const gallery = logo.nextElementSibling;
  if (gallery.classList.contains('show')) {
    gallery.classList.remove('show');
  } else {
    gallery.classList.add('show');
  }
}

// Add Stickers to Team Highlights
document.querySelectorAll('.wins').forEach(teamSection => {
  const teamName = teamSection.querySelector('h3').textContent.trim();
  const sticker = document.createElement('img');
  sticker.className = 'sticker';

  switch (teamName) {
    case 'AC Milan':
      sticker.src = 'images/bacho/bacho.jpg';
      break;
    case 'Barcelona':
      sticker.src = 'images/luksona/luksona.jpg';
      break;
    case 'PSG':
      sticker.src = 'images/giga/giga.jpg';
      break;
    case 'Real Madrid':
      sticker.src = 'images/niksona/niksona.jpg';
      break;
    default:
      sticker.src = 'images/stickers/default-sticker.png';
  }

  teamSection.prepend(sticker);
});

// Enhanced Sorting Functionality
function sortTable(columnIndex, dataType) {
  const table = document.getElementById('leagueTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  const teamRows = rows.filter(row => !row.classList.contains('separator'));
  const separatorRows = rows.filter(row => row.classList.contains('separator'));

  // Toggle sort order if the same column is clicked again
  if (currentSortColumn === columnIndex) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = columnIndex;
    isAscending = true;
  }

  teamRows.sort((a, b) => {
    const aCell = a.cells[columnIndex];
    const bCell = b.cells[columnIndex];
    let aValue, bValue;

    switch (dataType) {
      case 'number':
        aValue = parseInt(aCell.textContent);
        bValue = parseInt(bCell.textContent);
        break;
      case 'string':
        aValue = aCell.textContent.trim().toLowerCase();
        bValue = bCell.textContent.trim().toLowerCase();
        break;
      case 'goals':
        const aGoals = aCell.textContent.split(':').map(Number);
        const bGoals = bCell.textContent.split(':').map(Number);
        aValue = aGoals[0] - aGoals[1];
        bValue = bGoals[0] - bGoals[1];
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return isAscending ? -1 : 1;
    if (aValue > bValue) return isAscending ? 1 : -1;
    return 0;
  });

  // Clear and rebuild the table
  tbody.innerHTML = '';
  let teamIndex = 0;
  rows.forEach((row) => {
    if (row.classList.contains('separator')) {
      tbody.appendChild(row);
    } else {
      const teamRow = teamRows[teamIndex];
      teamRow.cells[0].textContent = teamIndex + 1; // Update position
      tbody.appendChild(teamRow);
      teamIndex++;
    }
  });

  // Add visual feedback for sorted column
  const headers = table.querySelectorAll('th');
  headers.forEach((header, index) => {
    if (index === columnIndex) {
      header.setAttribute('data-sort', isAscending ? 'asc' : 'desc');
    } else {
      header.removeAttribute('data-sort');
    }
  });
}

// Add at the top with other constants
const matchForm = document.getElementById('matchForm');

// Add this function to update team statistics
function updateTeamStats(teamName, goalsFor, goalsAgainst, isWin, isDraw) {
  const rows = document.querySelectorAll('#leagueTable tbody tr:not(.separator)');
  
  rows.forEach(row => {
    const teamCell = row.cells[1];
    if (teamCell.querySelector('b').textContent === teamName) {
      const cells = row.cells;
      cells[2].textContent = parseInt(cells[2].textContent) + 1; // Played
      cells[3].textContent = parseInt(cells[3].textContent) + (isWin ? 1 : 0); // Won
      cells[4].textContent = parseInt(cells[4].textContent) + (isDraw ? 1 : 0); // Draw
      cells[5].textContent = parseInt(cells[5].textContent) + (!isWin && !isDraw ? 1 : 0); // Lost
      
      const [currentFor, currentAgainst] = cells[6].textContent.split(':').map(Number);
      cells[6].textContent = `${currentFor + goalsFor}:${currentAgainst + goalsAgainst}`; // +/- 
      
      const points = (parseInt(cells[3].textContent) * 3) + parseInt(cells[4].textContent);
      cells[7].querySelector('.points').textContent = points; // Points
    }
  });
}

// Add match form submission handler
matchForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const homeTeam = document.getElementById('homeTeam').value;
  const awayTeam = document.getElementById('awayTeam').value;
  const homeScore = parseInt(document.getElementById('homeScore').value);
  const awayScore = parseInt(document.getElementById('awayScore').value);

  if (homeTeam === awayTeam) {
    alert('A team cannot play against itself!');
    return;
  }

  // Save match to Firestore
  addMatch(homeTeam, awayTeam, homeScore, awayScore);

  // Update stats
  const isDraw = homeScore === awayScore;
  
  // Update home team stats
  updateTeamStats(
    homeTeam,
    homeScore,
    awayScore,
    homeScore > awayScore,
    isDraw
  );

  // Update away team stats
  updateTeamStats(
    awayTeam,
    awayScore,
    homeScore,
    awayScore > homeScore,
    isDraw
  );

  // Update form and sort table
  sortTable(7, 'number');
  this.reset();
});

// Function to add match to Firestore
function addMatch(homeTeam, awayTeam, homeScore, awayScore) {
  db.collection('matches').add({
    homeTeam: homeTeam,
    awayTeam: awayTeam,
    homeScore: homeScore,
    awayScore: awayScore,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log('Match added to Firestore');
  })
  .catch((error) => {
    console.error('Error adding match to Firestore: ', error);
  });
}

// Fetch and display existing matches
function fetchMatches() {
  db.collection('matches').orderBy('timestamp', 'desc').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const match = doc.data();
        updateTeamStats(
          match.homeTeam,
          match.homeScore,
          match.awayScore,
          match.homeScore > match.awayScore,
          match.homeScore === match.awayScore
        );
        updateTeamStats(
          match.awayTeam,
          match.awayScore,
          match.homeScore,
          match.awayScore > match.homeScore,
          match.homeScore === match.awayScore
        );
      });
      sortTable(7, 'number'); // Sort by Points (column 7)
    })
    .catch((error) => {
      console.error('Error fetching matches: ', error);
    });
}

// Loading Spinner
window.onload = () => {
  document.getElementById('loading').style.display = 'none';
  fetchMatches(); // Fetch and display existing matches
};