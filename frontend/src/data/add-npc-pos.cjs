const fs = require('fs');
const path = 'D:/legal-for-teen/frontend/src/data/detectiveCases.ts';
let content = fs.readFileSync(path, 'utf8');

// NPC positions for each case (mapped by npc id)
const positions = {
  // Case 1: art room (original positions from hardcoded code)
  'npc-xiaomei': { x: 22, y: 55 },
  'npc-chenhao': { x: 72, y: 35 },
  'npc-linyue': { x: 40, y: 40 },
  // Case 2: canteen
  'npc-zhang': { x: 25, y: 50 },
  'npc-xiaoyu': { x: 55, y: 40 },
  'npc-chen': { x: 65, y: 55 },
  // Case 3: rumor
  'npc-zhao': { x: 30, y: 45 },
  'npc-linsi': { x: 55, y: 35 },
  'npc-teacher': { x: 65, y: 50 },
  // Case 4: gym
  'npc-coach': { x: 70, y: 40 },
  'npc-maqiang': { x: 40, y: 30 },
  'npc-liu': { x: 55, y: 50 },
  // Case 5: ghost
  'npc-zhangqing': { x: 30, y: 45 },
  'npc-wanghao': { x: 60, y: 40 },
  'npc-lixiaoming': { x: 45, y: 50 },
};

// For each NPC, find "role": "..." and insert x, y after it
for (const [npcId, pos] of Object.entries(positions)) {
  const search = '"id": "' + npcId + '"';
  const idx = content.indexOf(search);
  if (idx < 0) {
    console.log('Not found:', npcId);
    continue;
  }

  // Find the "sceneId" line after this NPC
  const sceneIdMarker = '"sceneId":';
  const sceneIdx = content.indexOf(sceneIdMarker, idx);
  if (sceneIdx < 0) {
    console.log('No sceneId for', npcId);
    continue;
  }

  // Find end of sceneId line (next \n)
  const lineEnd = content.indexOf('\n', sceneIdx);
  if (lineEnd < 0) continue;

  // Insert x, y after the sceneId line
  const insertion = ',\n  "x": ' + pos.x + ',\n  "y": ' + pos.y;
  content = content.substring(0, lineEnd + 1) + insertion + content.substring(lineEnd + 1);
  console.log('Added x,y to', npcId);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
