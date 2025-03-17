document.addEventListener('DOMContentLoaded', () => {
    const menubar = document.querySelector('.menubar');
    const items = [...menubar.children];
    
    // Create nested structure
    const processLevel = (items, depth) => {
      let currentParent = null;
      let currentSubmenu = null;
      
      items.forEach(item => {

        // handle index items
        const itemPath = item.dataset.path;
        const filename = itemPath?.split('/').pop();
        const filenameWithoutExt = filename?.replace(/\.[^.]*$/, '');

        if (filenameWithoutExt?.toLowerCase().endsWith('index')) {
            item.dataset.depth = parseInt(item.dataset.depth) - 1;
        }

        const itemDepth = parseInt(item.dataset.depth);
                
        if (itemDepth === depth) {
          currentParent = item;
          currentSubmenu = null;
        } else if (itemDepth > depth) {
          if (!currentSubmenu) {
            currentSubmenu = document.createElement('ul');
            currentSubmenu.className = 'sub-menu';
            currentParent.appendChild(currentSubmenu);
          }
          currentSubmenu.appendChild(item);
        }
      });
      
      // Process next level
      const submenuItems = menubar.querySelectorAll(`[data-depth="${depth + 1}"]`);
      if (submenuItems.length) {
        processLevel(items, depth + 1);
      }
    };
  
    processLevel(items, 1);
  });