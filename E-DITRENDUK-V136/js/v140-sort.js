/* V140: satu tombol urutan tanggal menggantikan dropdown dua pilihan. */
(function(){
  const targets=['rakomSort','monitorDateSort','repoDateSort','logDateSort','archiveDateSort'];
  const labelFor=(value)=>/asc|old|lama/i.test(value)?'Terlama dahulu ↑':'Terbaru dahulu ↓';
  function enhance(){
    for(const id of targets){
      const sel=document.getElementById(id);
      if(!sel||sel.tagName!=='SELECT'||sel.dataset.edSortEnhanced==='1'||sel.options.length!==2)continue;
      sel.dataset.edSortEnhanced='1';
      const button=document.createElement('button');
      button.type='button';button.className='btn btn-outline ed-sort-toggle';
      button.setAttribute('aria-label','Ubah urutan tanggal');
      const update=()=>{button.textContent=labelFor(sel.value);button.title='Klik untuk membalik urutan tanggal';};
      button.addEventListener('click',()=>{
        sel.selectedIndex=sel.selectedIndex===0?1:0;
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        update();
      });
      sel.addEventListener('change',update);
      sel.classList.add('ed-sort-original');
      sel.insertAdjacentElement('afterend',button);
      const lbl=document.querySelector('label[for="'+id+'"]');
      if(lbl)lbl.textContent='Urut tanggal';
      update();
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{enhance();
    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),20000);
  });
})();
