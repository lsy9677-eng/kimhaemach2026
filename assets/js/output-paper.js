export function outputPaperDimensions(paper='A4',direction='landscape',margin=10){
 const name=paper==='A3'?'A3':'A4',orientation=direction==='portrait'?'portrait':'landscape';
 const sides=name==='A3'?[297,420]:[210,297];
 const width=orientation==='portrait'?sides[0]:sides[1],height=orientation==='portrait'?sides[1]:sides[0];
 return {paper:name,direction:orientation,margin,width,height,contentWidth:width-margin*2,contentHeight:height-margin*2};
}
export function planOutputCards(cards){
 const pages=[];let page=[],capacity=4;
 for(let index=0;index<cards.length;index++){
  const card=cards[index],limit=card.tree||card.rows>14?1:card.rows>8?2:4;
  if(page.length&&page.length+1>Math.min(capacity,limit)){pages.push(page);page=[];capacity=4;}
  capacity=Math.min(capacity,limit);page.push(index);
 }
 if(page.length)pages.push(page);return pages;
}
