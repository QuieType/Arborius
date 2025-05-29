const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnn8LNWJDXnoon7eJCAYKyF56JdW4Pn3jrUlWZH56YhRb1-p7Quv9DqXXb6tEfYMGjDn-wyt7qcqlX/pub?output=csv';
const gridSize = 150;

let dragged = null;
let offsetX = 0;
let offsetY = 0;
let currentZ = 1;
let cardcount = 0;

fetch(csvUrl)
  .then(response => response.text())
  .then(csvData => {
    const rows = csvData.trim().split("\n");
    const headers = rows[0].split(",");

    rows.slice(1).forEach(row => {
        const values = row.split(",");
        const card = {};
        headers.forEach((key, i) => card[key] = values[i]);

        card.type = "#fee";
        card.bordertype = "#800";
        makeCard(card);

        card.bordertype = "#008";
        card.type = "#eef";
        makeCard(card);
    });
  })
  .catch(error => {
    console.error('Failed to fetch CSV data:', error);
  });

function sendCardMove(cardEl) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
  
    socket.send(JSON.stringify({
      type: 'move',
      id: cardEl.dataset.cardId,
      x: parseInt(cardEl.style.left, 10),
      y: parseInt(cardEl.style.top, 10),
      z: cardEl.dataset.overlapCount,
      rotation: parseInt(cardEl.getAttribute('data-rotation') || '0', 10)
    }));
}

function makeCard(card) {    
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable';
    wrapper.style.left = card.x + 'px';
    wrapper.style.top = card.y + 'px';
    wrapper.style.zIndex = 1;
    
    wrapper.innerHTML = `
      <div class="cardframe" style="background: ${card.type}; box-shadow: 4px 4px 0 ${card.bordertype}, 7px 7px 0 ${card.bordertype};">
        <div class="info">
          <div class="name" style="background-color: ${card.namecolor};">
            <h1>${card.name}<h5>${card.archea}</h5></h1>
          </div>
          <img class="minitableau" src="${card.imgurl}">
          <div class="description" style="background-color: #fff0;">
            <div class="text">
              <div class="trigger">${card.trigger}</div>
              <div class="triggerarrow"></div>
              <div class="abilityarrow"></div>
              <div class="ability">${card.ability}</div>
            </div>
          </div>
        </div>
      </div>`;
    
    document.getElementById('game').appendChild(wrapper);
    
    wrapper.addEventListener('mousedown', (e) => {
        dragged = wrapper;
        offsetX = e.clientX - wrapper.offsetLeft;
        offsetY = e.clientY - wrapper.offsetTop;
        wrapper.style.zIndex = ++currentZ;
        wrapper.style.cursor = 'grabbing';
        wrapper.classList.add('dragging');
    });

    wrapper.dataset.cardId = cardcount++;
    wrapper.addEventListener('mouseenter', () => hovered = wrapper);
    wrapper.addEventListener('mouseleave', () => hovered = null);
}

document.addEventListener('mousemove', (e) => {
    if (dragged) {
        dragged.style.left = (e.clientX - offsetX) + 'px';
        dragged.style.top  = (e.clientY - offsetY) + 'px';
    }
});
