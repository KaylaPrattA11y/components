import Modal from "../Modal/component";
import TabbedModal from "./component";

/**
 * @desc Adds event listeners for the TabbedModal component.
 */
export default function tabbedModalEventListeners() {
  document.addEventListener("click", event => {
    const ariaControls = event.target.getAttribute("aria-controls");
    if (!ariaControls) return;
    const [dialogId, tabpanelId] = ariaControls.split(" ");
    const dialogEl = document.getElementById(dialogId);
    const tabpanelEl = document.getElementById(tabpanelId);

    if (dialogEl) {
      const isDialog = dialogEl instanceof HTMLDialogElement;
      const isTabbed = dialogEl.classList.contains("is-tabbed");
      const newModalOnly = dialogEl.classList.contains("neo-dialog"); // Only allow this to happen on new modals, not legacy ones. @TODO: remove this once all "Dialog" components are replaced.

      if (isDialog && isTabbed && newModalOnly) {
        Modal.toggle(dialogId, true, event.target);
      }
    }
    if (tabpanelEl) {
      const isTabpanel = tabpanelEl.getAttribute("role") === "tabpanel";

      if (isTabpanel) {
        const tabEl = dialogEl.querySelector(`[aria-controls="${tabpanelId}"]`);
        TabbedModal.tabClickHandler(tabEl);
      }
    }
  });
}
