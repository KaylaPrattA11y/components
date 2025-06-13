import Modal from "../Modal";

/**
 * @class TabbedModal
 * @extends Modal
 * @classdesc A modal dialog with a tabbed interface for organizing content.
 */
export default class TabbedModal extends Modal {
  /**
   * @param {Object} settings
   * @param {Function} [settings.onSelectTab] Callback function to be called when a tab is selected
   */
  constructor({ onSelectTab, ...settings }) {
    super(settings); // Pass all settings to Modal
    this.onSelectTab = onSelectTab;
    this.buildTablist();
    this.dialog.classList.add("is-tabbed");
  }

  buildTablist() {
    const tablist = document.createElement("div");

    tablist.className = "neo-dialog-tablist";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Tabbed Modal Tab Group");
    tablist.setAttribute(
      "aria-orientation",
      ["offcanvas-left", "offcanvas-right"].includes(this.variant) ? "vertical" : "horizontal"
    );
    tablist.id = `${this.id}Tabgroup`;
    this.dialog.querySelector(".neo-dialog-content").insertAdjacentElement("beforebegin", tablist);

    /** @type {HTMLDivElement} The tablist containing all tab buttons */
    this.tablist = tablist;
  }

  /**
   * Adds a tab button to the tablist
   * @param {Object} options
   * @param {String} options.label The (brief) text in the tab button
   * @param {String} options.tabpanelId The ID of the tab panel that this tab button controls
   * @param {String} [options.iconName] The name of the icon to display on the tab button
   * @param {String} [options.menuitem] The main menu item to associate with this tab button, if any
   * @param {Boolean} [options.isSelected=false] Whether this tab button should be selected by default
   * @param {Boolean} [options.isDisabled=false] Whether this tab button should be disabled
   * @param {Number} [options.position=-1] The position in the tablist to insert the tab button at. If -1, appends to the end
   */
  addTab({ label, tabpanelId, iconName, menuitem, isSelected = false, isDisabled = false, position = -1 }) {
    if (this.getTab(tabpanelId)) return; // Prevent creation of duplicate tabs
    const tab = document.createElement("button");
    const tabpanel = document.getElementById(tabpanelId);

    tab.className = "neo-dialog-tab";
    if (iconName) {
      tab.classList.add(`icon-${iconName}`);
    }
    if (menuitem) {
      tab.setAttribute("data-menuitem", menuitem);
      tabpanel.setAttribute("data-menuitem", menuitem);
    }
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", isSelected);
    tab.setAttribute("aria-controls", tabpanelId);
    tab.id = `${this.id}${tabpanelId}Tab`;
    tab.disabled = isDisabled;
    tab.textContent = label;
    tabpanel.classList.toggle("d-none", !isSelected);
    tabpanel.setAttribute("role", "tabpanel");
    tabpanel.setAttribute("aria-labelledby", tab.id);
    if (position >= 0) {
      this.tablist.insertBefore(tab, this.tablist.children[position]);
    } else {
      this.tablist.appendChild(tab);
    }
    tab.addEventListener("click", () => this.selectTab(tabpanelId));
  }

  /**
   * @param {HTMLButtonElement} tab The tab button element that was clicked
   */
  static tabClickHandler(tab) {
    const isSelected = tab.getAttribute("aria-selected") === "true";
    if (isSelected || tab.disabled) return;
    const tablist = tab.closest(`[role="tablist"]`);

    [...tablist.children].forEach(t => {
      if (tab !== t) {
        const tp = document.getElementById(t.getAttribute("aria-controls"));

        t.setAttribute("aria-selected", "false");
        tp?.classList.add("d-none");
      }
    });
    const tabpanel = document.getElementById(tab.getAttribute("aria-controls"));

    tab.setAttribute("aria-selected", "true");
    tabpanel?.classList.remove("d-none");
  }

  /**
   * Selects the tab button corresponding to the given tab panel ID and de-selects all others
   * @param {String} tabpanelId The ID of the tab panel for which to select the corresponding tab button
   */
  selectTab(tabpanelId) {
    const tabpanel = document.getElementById(tabpanelId);
    const tab = this.getTab(tabpanelId);

    [...this.tablist.children].forEach(t => {
      if (tab !== t) {
        this.deselectTab(t.getAttribute("aria-controls"));
      }
    });

    tab.setAttribute("aria-selected", "true");
    tabpanel?.classList.remove("d-none");

    if (this.onSelectTab) {
      this.onSelectTab(this);
    }
  }

  /**
   * De-selects the tab button corresponding to the given tab panel ID
   * @param {String} tabpanelId The ID of the tab panel for which to de-select the corresponding tab button
   */
  deselectTab(tabpanelId) {
    const tabpanel = document.getElementById(tabpanelId);

    this.getTab(tabpanelId).setAttribute("aria-selected", "false");
    tabpanel?.classList.add("d-none");
  }

  /**
   * Disables the tab button corresponding to the given tab panel ID
   * @param {String} tabpanelId The ID of the tab panel for which to get the corresponding tab button
   * @param {Boolean} [doDisable=true] Whether to disable the tab button
   */
  disableTab(tabpanelId, doDisable = true) {
    this.getTab(tabpanelId).disabled = doDisable;
  }

  /**
   * Removes the tab button corresponding to the given tab panel ID
   * @param {String} tabpanelId The ID of the tab panel for which to get the corresponding tab button
   * @param {Boolean} [destroyTabPanel=false] Whether to also remove the corresponding tab panel element from the DOM
   */
  destroyTab(tabpanelId, destroyTabPanel = false) {
    if (!this.getTab(tabpanelId)) return; // Prevent removal of non-existent tabs
    this.getTab(tabpanelId).remove();
    if (destroyTabPanel) {
      const tabpanel = document.getElementById(tabpanelId);
      tabpanel.remove();
    }
  }

  /**
   * Removes all tab buttons from the tablist
   * @param {Boolean} [destroyAllTabPanels=false] Whether to also remove all corresponding tab panel elements from the DOM
   */
  destroyAllTabs(destroyAllTabPanels = false) {
    [...this.tablist.children].forEach(tab => {
      tab.remove();
      if (destroyAllTabPanels) {
        const tabpanel = document.getElementById(tab.getAttribute("aria-controls"));
        tabpanel?.remove();
      }
    });
  }

  /**
   * Gets the tab element corresponding to the given tab panel ID
   * @param {String} tabpanelId The ID of the tab panel for which to get the corresponding tab button
   * @returns {HTMLButtonElement} The tab button corresponding to the given tab panel ID
   */
  getTab(tabpanelId) {
    return this.tablist.querySelector(`button[aria-controls="${tabpanelId}"]`);
  }

  /**
   * Gets the tab panel element corresponding to the given tab's index (0 being the first tab)
   * @param {Number} tabIndex The index of the tab panel to retrieve (0-based)
   * @returns {HTMLElement} The tab panel element corresponding to the given tab index
   */
  getTabPanelByTabIndex(tabIndex) {
    const ariaControls = this.tablist.children[tabIndex].getAttribute("aria-controls");
    return document.getElementById(ariaControls);
  }

  /**
   * Gets the currently selected tab button
   * @return {HTMLButtonElement} The currently selected tab button
   */
  get selectedTab() {
    return [...this.tablist.children].find(tab => tab.getAttribute("aria-selected") === "true");
  }

  /**
   * Gets the currently selected tab panel element
   * @return {HTMLElement} The currently selected tab panel element
   */
  get selectedTabpanel() {
    return document.getElementById(this.selectedTab?.getAttribute("aria-controls"));
  }
}
