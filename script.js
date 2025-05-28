const socket = new WebSocket('wss://arborius.online');

socket.addEventListener('open', () => {
    console.log('WebSocket connection established');
});

socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'move') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.id);
        if (target) {
            target.style.left = msg.x + 'px';
            target.style.top = msg.y + 'px';
            target.setAttribute('data-rotation', msg.rotation);
            target.style.transform = `translate(${-10 * msg.z}px, ${-10 * msg.z}px)`;
            target.style.zIndex = ++currentZ;
            const info = target.querySelector('.info');
            info.style.transform = `rotate(${msg.rotation}deg)`;
        }
    }
    else if (msg.type === 'delete') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.id);
        target.remove();
        target = null;
    }
    else if (msg.type === 'duplicate') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.srcid);
        const clone = target.cloneNode(true);
        const offset = 20;
        clone.dataset.cardId = msg.id;
        clone.style.left = (parseInt(target.style.left, 10) + offset) + 'px';
        clone.style.top = (parseInt(target.style.top, 10) + offset) + 'px';
        clone.style.zIndex = ++currentZ;
        document.body.appendChild(clone);
        
        // Ensure cloned element has same events
        clone.addEventListener('mousedown', (e) => {
            dragged = clone;
            offsetX = e.clientX - clone.offsetLeft;
            offsetY = e.clientY - clone.offsetTop;
            clone.style.zIndex = ++currentZ;
            clone.style.cursor = 'grabbing';
            clone.classList.add('dragging');
        });
        clone.addEventListener('mouseenter', () => target = clone);
        clone.addEventListener('mouseleave', () => target = null);
    }
});

const csvData = `copies,name,archea,trigger,ability,imgurl,fancyname,fancylore,fancyimage,,,
1,blob,1,play,must freeze,blob.png,The Nameless Form,,,blob,blob.png,5.704545455
1,amulet,2,unplay,freezes,amulet.png,Embowelments of the Jar Man,,,amulet,amulet.png,
1,mushroom,2,rotate,rotate,mushroom.png,Forest Mushroom,,,mushroom,mushroom.png,
1,horse,3,advance,advance,horse.png,Omnilogue of the Redeemer,,omnilogue.png,horse,horse.png,
`;

const rows = csvData.trim().split("\n");
const headers = rows[0].split(",");
const cards = rows.slice(1).map(row => {
    const values = row.split(",");
    const obj = {};
    headers.forEach((key, i) => obj[key] = values[i]);
    return obj;
});

let dragged = null;
let offsetX = 0;
let offsetY = 0;
let currentZ = 1;
const gridSize = 150;
let cardcount = 0;

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
    
    document.body.appendChild(wrapper);
    
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
  

document.addEventListener('mousemove', (e) => {
    if (dragged) {
        dragged.style.left = (e.clientX - offsetX) + 'px';
        dragged.style.top  = (e.clientY - offsetY) + 'px';
    }
});

document.addEventListener('keydown', (e) => {
    if (!hovered) {return;}
    if ((e.key === 'q' || e.key === 'e')) {
        let currentRotation = parseInt(hovered.getAttribute('data-rotation') || '0', 10);
        if (e.key === 'q') currentRotation -= 90;
        if (e.key === 'e') currentRotation += 90;
        hovered.setAttribute('data-rotation', currentRotation);
        
        const cardFrame = hovered.querySelector('.cardframe');
        const angle = currentRotation % 360;
        
        // Adjust box shadow based on rotation angle
        let shadowX = 4, shadowY = 4, shadowX2 = 7, shadowY2 = 7;
        
        const borderColor = getComputedStyle(cardFrame).borderColor;
        cardFrame.style.boxShadow = `${shadowX}px ${shadowY}px 0 ${borderColor}, ${shadowX2}px ${shadowY2}px 0 ${borderColor}`;

        // Apply rotation only to inner content
        const info = cardFrame.querySelector('.info');
        info.style.transform = `rotate(${currentRotation}deg)`;
        sendCardMove(hovered);
    }
    
    if (e.key === 'd') {
        const clone = hovered.cloneNode(true);
        const offset = 20;
        clone.dataset.cardId = cardcount++;
        clone.style.left = (parseInt(hovered.style.left, 10) + offset) + 'px';
        clone.style.top = (parseInt(hovered.style.top, 10) + offset) + 'px';
        clone.style.zIndex = 100;
        document.body.appendChild(clone);
        
        // Ensure cloned element has same events
        clone.addEventListener('mousedown', (e) => {
            dragged = clone;
            offsetX = e.clientX - clone.offsetLeft;
            offsetY = e.clientY - clone.offsetTop;
            clone.style.zIndex = 100;
            clone.style.cursor = 'grabbing';
            clone.classList.add('dragging');
        });
        clone.addEventListener('mouseenter', () => hovered = clone);
        clone.addEventListener('mouseleave', () => hovered = null);
        socket.send(JSON.stringify({
            type: 'duplicate',
            id: clone.dataset.cardId,
            srcid: hovered.dataset.cardId,
            x: parseInt(offsetX),
            y: parseInt(offsetY),
            z: clone.dataset.overlapCount,
            rotation: parseInt(clone.getAttribute('data-rotation') || '0', 10)
        }));
    }
    if (e.key === 'Backspace') {
        socket.send(JSON.stringify({
            type: 'delete',
            id: hovered.dataset.cardId
        }));
        hovered.remove();
        hovered = null;
    }
});

document.addEventListener('mouseup', () => {
    if (!dragged) {return;}
    let left = parseInt(dragged.style.left, 10);
    let top = parseInt(dragged.style.top, 10);
    dragged.style.left = Math.round(left / gridSize) * gridSize + 'px';
    dragged.style.top = Math.round(top / gridSize) * gridSize + 'px';
    dragged.style.cursor = 'grab';
    dragged.classList.remove('dragging');
    
    // Check for overlap and count
    const draggedRect = dragged.getBoundingClientRect();
    let overlapCount = 0;
    document.querySelectorAll('.draggable').forEach(el => {
        if (el !== dragged) {
            const rect = el.getBoundingClientRect();
            const overlap = !(
                draggedRect.right < rect.left+50 ||
                draggedRect.left > rect.right-50 ||
                draggedRect.bottom < rect.top+50 ||
                draggedRect.top > rect.bottom-50
            );
            if (overlap) {
                overlapCount++;
                console.log(overlapCount);
            }
        }
    });
    dragged.dataset.overlapCount = overlapCount;
    sendCardMove(dragged);
    
    // Apply transform based on overlap count
    dragged.style.transform = `translate(${-10 * overlapCount}px, ${-10 * overlapCount}px)`;
    dragged = null;
});
