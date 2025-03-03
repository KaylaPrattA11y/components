import { i18n, i18nReplace } from "js/translations";
import FormHelper from "./FormHelper";
import { getFieldLabel, getFieldValue } from "./utilities";
import { dataShow, dataHide } from "../../../v1.5/binding-utils";

/**
 * @desc A class that provides methods for managing the form data table element, which displays the form field names, values, and validity states.
 * @class FormTable
 */
export default class FormTable {
  /**
   * @desc Creates a button to jump to edit the field in the form
   * @param {HTMLTableCellElement} valueCell 
   * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} fieldElement 
   * @param {string} fieldName The human-readable name of the field
   */
  static buildEditFieldButton(valueCell, fieldElement, fieldName) {
    const editFieldButton = document.createElement("button");
    const isSelect = fieldElement instanceof HTMLSelectElement;
    const isRadio = fieldElement instanceof RadioNodeList;
    let href = fieldElement.id || "#";

    editFieldButton.className = "icon-sm icon-edit-solid btn-default mis-xs";
    editFieldButton.type = "button";
    editFieldButton.dataset.hide = "isReceiptMode";
    editFieldButton.setAttribute("aria-label", i18nReplace("editN", fieldName));
    if (isRadio) {
      const checked = [...fieldElement].find(radio => radio.checked);
      href = checked ? checked.id : fieldElement[0].id;
    } else if (isSelect && document.getElementById(`${fieldElement.id}-button`)) {
      href = `${fieldElement.id}-button`;
    }
    editFieldButton.addEventListener("click", event => {
      event.preventDefault();
      window.location.hash = `#${href}`;
      document.getElementById(href).scrollIntoView({ 
        behavior: "smooth",
        block: "center",
       });
      document.getElementById(href).focus();
    });
    valueCell.appendChild(editFieldButton);
  }

  /**
   * @desc Updates the existing table's body with the latest form data
   * @param {HTMLFormElement} formElement
   * @param {HTMLTableElement} tableElement
   */
  static updateTableBody(formElement, tableElement) {
    const formData = FormHelper.getFormDataArray(formElement);
    const hasEditButtons = tableElement.dataset.hasEditButtons === "true";
    let tbody = tableElement.querySelector("tbody");
    
    if (tbody) {
      tbody.remove();
    }
		tbody = tableElement.createTBody();
    formData.forEach(field => {
      const fieldElement = formElement.elements[field.name];
      const rowAlreadyExists = tbody.querySelector(`tr[data-field-name="${field.name}"]`);
      const isDisabledOrHidden = fieldElement?.disabled || fieldElement?.type === "hidden";
      const doExclude = fieldElement.dataset?.excludeFormTable;
      if (rowAlreadyExists || isDisabledOrHidden || doExclude === "true") return;

      const row = tbody.insertRow();
      const nameCell = row.insertCell(0);
      const valueCell = row.insertCell(1);
      const fieldIsInvalid = fieldElement?.validity?.valid === false;
      const fieldName = getFieldLabel(fieldElement);
			const fieldValue = getFieldValue(fieldElement);

      row.dataset.fieldName = field.name;
      row.classList.toggle("error-color", fieldIsInvalid);
      nameCell.className = "ts-body-2";
      valueCell.className = "ts-body-1";
      nameCell.innerText = fieldName;
      valueCell.innerText = fieldValue;
			if (hasEditButtons) {
				FormTable.buildEditFieldButton(valueCell, fieldElement, fieldName);
			}
    });
  }

/**
   * @desc Creates a table element with the form data
   * @param {HTMLFormElement} formElement
   * @param {string} tableSettings.id Add an id to the table. Optional
   * @param {string} tableSettings.className Add a class name to the table. Optional
   * @param {string|null} tableSettings.caption Add a string to the table caption. Optional
   * @param {boolean} tableSettings.thead Add a table header to the table. Default false
   * @param {boolean} tableSettings.hasEditButtons Add an edit button to the table next to the current value. Default false
   * @returns {HTMLTableElement} A table element with the form data. 
   */
  static generateTable(
    formElement, 
    tableSettings = {
      id: null, 
      className: null, 
      caption: null, 
      thead: false, 
      hasEditButtons: false
    }
    ) {
    const tableElement = document.createElement("table");

    if (tableSettings.id) {
      tableElement.id = tableSettings.id;
    }
    if (tableSettings.className) {
      tableElement.className = tableSettings.className;
    }
    if (tableSettings.caption) {
      const caption = tableElement.createCaption();
      caption.innerText = tableSettings.caption;
      caption.className = "ts-h3-aa mbe-xs";
    }
    if (tableSettings.thead) {
      const thead = tableElement.createTHead();
      const headerRow = thead.insertRow();
      const nameHeader = headerRow.insertCell(0);
      const valueHeader = headerRow.insertCell(1);
      
      thead.className = "ts-subtitle-2";
      nameHeader.innerText = "Field Name";
      valueHeader.innerText = "Value";
    }
    tableElement.dataset.hasEditButtons = tableSettings.hasEditButtons;
    FormTable.updateTableBody(formElement, tableElement);
    return tableElement;
  }

  /**
   * @desc Creates a table footer with an optional print button and hides any "Edit" buttons
   * @param {HTMLTableElement} tableElement 
   * @param {boolean} doEnable 
   */
  static enableReceiptMode(tableElement, doEnable = true) {
    let tfoot = tableElement.querySelector("tfoot");
    
    // If tfoot doesn't exist, create it
    if (!tfoot) {
      tfoot = tableElement.createTFoot();
      const footerRow = tfoot.insertRow();
      const footerCell = footerRow.insertCell(0);
      const printButton = document.createElement("button");

      tfoot.dataset.show = "isReceiptMode";
      tfoot.className = "text-center";
      printButton.type = "button";
      printButton.className = "btn-secondary icon-sm icon-download mis-xs";
      printButton.innerText = i18n("download");
      printButton.addEventListener("click", event => {
        // @TODO: make this better
        event.preventDefault();
        window.print();
      });
      footerCell.appendChild(printButton);
      footerCell.colSpan = 2;
    }
    dataShow(tableElement, { isReceiptMode: doEnable });
    dataHide(tableElement, { isReceiptMode: doEnable });
  }
}