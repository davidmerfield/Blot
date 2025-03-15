
class SidebarNavigation {
    constructor() {
      this.menubar = document.querySelector('.sidebar');
      this.items = Array.from(this.menubar.querySelectorAll('li'));
      this.menuStructure = new Map();
    }
  
    normalizeDepths() {
      const minDepth = Math.min(...this.items.map(item => parseInt(item.dataset.depth)));
      const delta = minDepth - 1;
  
      if (delta > 0) {
        this.items.forEach(item => {
          const currentDepth = parseInt(item.dataset.depth);
          item.dataset.depth = currentDepth - delta;
        });
      }
    }
  
    adjustIndexPageDepths() {
      this.items.forEach(item => {
        const filename = item.dataset.filename;
        const filenameWithoutExt = filename?.replace(/\.[^.]*$/, '');
        if (filenameWithoutExt?.toLowerCase().endsWith('index')) {
          item.dataset.depth = parseInt(item.dataset.depth) - 1;
        }
      });
    }
  
    getItemId(item) {
      return item.querySelector('a')?.getAttribute('href');
    }
  
    loadSavedState() {
      try {
        return new Set(JSON.parse(localStorage.getItem('menuState')) || []);
      } catch {
        return new Set();
      }
    }
  
    saveState() {
      const expanded = Array.from(document.querySelectorAll('.has-submenu.expanded'))
        .map(item => this.getItemId(item));
      localStorage.setItem('menuState', JSON.stringify(expanded));
    }
  
    buildMenuStructure() {
      const depthStack = [];
      
      this.items.forEach(item => {
        item.style.setProperty('--depth', item.dataset.depth);
      });
  
      this.items.forEach((item, index) => {
        const depth = parseInt(item.dataset.depth);
        
        while (depthStack.length > 0 && depthStack[depthStack.length - 1].depth >= depth) {
          depthStack.pop();
        }
        
        if (this.items[index + 1] && parseInt(this.items[index + 1].dataset.depth) > depth) {
          const submenu = document.createElement('div');
          submenu.className = 'submenu';
          item.classList.add('has-submenu');
          this.menuStructure.set(item, submenu);
        }
        
        if (depthStack.length > 0) {
          const parent = depthStack[depthStack.length - 1].submenu;
          parent.appendChild(item);
        }
        
        if (this.menuStructure.has(item)) {
          depthStack.push({
            depth,
            submenu: this.menuStructure.get(item)
          });
        }
      });
  
      this.menuStructure.forEach((submenu, parent) => {
        parent.after(submenu);
      });
    }
  
    setSubmenuState(item, isExpanded) {
      const submenu = this.menuStructure.get(item);
      if (!submenu) return;
      
      item.classList.toggle('expanded', isExpanded);
      submenu.classList.toggle('expanded', isExpanded);
      submenu.style.display = isExpanded ? 'block' : 'none';
  
      // If collapsing, also collapse all nested submenus
      if (!isExpanded) {
        submenu.querySelectorAll('.has-submenu.expanded').forEach(nestedItem => {
          this.setSubmenuState(nestedItem, false);
        });
      }
    }
  
    getParentSubmenus(item) {
      const parents = new Set();
      let current = item.parentElement;
      
      while (current) {
        if (current.classList.contains('submenu')) {
          const parentItem = Array.from(this.menuStructure.entries())
            .find(([_, submenu]) => submenu === current)?.[0];
          if (parentItem) {
            parents.add(parentItem);
          }
        }
        current = current.parentElement;
      }
      
      return parents;
    }
  
    closeSiblingSubmenus(item) {
      // Get all parent items
      const parentItems = this.getParentSubmenus(item);
      
      // Find items at the same level
      const currentDepth = parseInt(item.dataset.depth);
      const siblings = Array.from(document.querySelectorAll('.has-submenu.expanded'))
        .filter(other => {
          // Skip if it's the same item
          if (other === item) return false;
          
          // Skip if it's a parent
          if (parentItems.has(other)) return false;
          
          // Skip if it's nested under a parent
          const otherParents = this.getParentSubmenus(other);
          if (Array.from(parentItems).some(parent => otherParents.has(parent))) return false;
          
          // Keep if it's at the same depth
          return parseInt(other.dataset.depth) === currentDepth;
        });
  
      // Close all siblings
      siblings.forEach(sibling => {
        this.setSubmenuState(sibling, false);
      });
    }
  
    handleSubmenuClick(item, e) {
      if (!this.menuStructure.has(item)) {
        return; // Not a submenu item, let the browser handle navigation
      }
  
      
      const isExpanded = item.classList.contains('expanded');
      const newState = !isExpanded;
      
      // Close sibling submenus at the same level
      // this.closeSiblingSubmenus(item);
      
      // Set new state for clicked item
      this.setSubmenuState(item, newState);
      
      // Save the new state
      this.saveState();
    }
  
    init() {
      this.normalizeDepths();
      this.adjustIndexPageDepths();
      this.buildMenuStructure();
  
      // Add click handlers
      document.querySelectorAll('.has-submenu').forEach(item => {
        const link = item.querySelector('a');
        link.addEventListener('click', (e) => this.handleSubmenuClick(item, e));
      });
  
      // Restore saved state
      const savedState = this.loadSavedState();
      if (savedState.size > 0) {
        document.querySelectorAll('.has-submenu').forEach(item => {
          if (savedState.has(this.getItemId(item))) {
            this.setSubmenuState(item, true);
          }
        });
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = new SidebarNavigation();
    sidebar.init();
  });
