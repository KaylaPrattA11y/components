import FormHelper from "./FormHelper";
import { getFieldLabel, getFieldValue } from "./utilities";

/**
 * @desc A class that provides methods for managing the form data table element, which displays the form field names, values, and validity states.
 * @class FormTableManager
 */
export default class FormTableManager {
  /**
   * @desc Updates the existing table's body with the latest form data
   * @param {HTMLFormElement} formElement
   * @param {HTMLTableElement} tableElement
   */
  static updateTableBody(formElement, tableElement) {
    const formData = FormHelper.getFormDataArray(formElement);
    const hasEditColumn = tableElement.dataset.hasEditColumn === "true";
    let tbody = tableElement.querySelector("tbody");
    
    if (tbody) {
      tbody.remove();
    }
		tbody = tableElement.createTBody();
    formData.forEach(field => {
      const fieldElement = formElement.elements[field.name];
      const doExclude = fieldElement.dataset?.excludeFromTable;
      const rowAlreadyExists = tbody.querySelector(`tr[data-field-name="${field.name}"]`);
      if (doExclude === "true" || rowAlreadyExists) return;
      const row = tbody.insertRow();
      const nameCell = row.insertCell(0);
      const valueCell = row.insertCell(1);
      const fieldIsInvalid = fieldElement?.validity?.valid === false;
      const fieldName = getFieldLabel(fieldElement);
			const fieldValue = getFieldValue(fieldElement);

      row.dataset.fieldName = field.name;
			if (hasEditColumn) {
				const editFieldCell = row.insertCell(2);
				const editFieldAnchor = document.createElement("a");
				editFieldAnchor.innerText = "🖊";
				editFieldAnchor.setAttribute("aria-label", `Edit ${fieldName}`);
				editFieldAnchor.setAttribute("href", `#${field.id || field.name}`);
				editFieldCell.appendChild(editFieldAnchor);
			}
      row.classList.toggle("is-invalid", fieldIsInvalid);
      nameCell.innerText = fieldName;
      valueCell.innerText = fieldValue;
    });
  }

/**
   * @desc Creates a table element with the form data
   * @param {HTMLFormElement} formElement
   * @param {string} tableSettings.id Add an id to the table. Optional
   * @param {string} tableSettings.className Add a class name to the table. Optional
   * @param {string|null} tableSettings.caption Add a string to the table caption. Optional
   * @param {boolean} tableSettings.thead Add a table header to the table. Default false
   * @param {boolean} tableSettings.hasEditColumn Add an edit button to the table. Default false
   * @returns {HTMLTableElement} A table element with the form data. 
   */
  static generateTable(
    formElement, 
    tableSettings = {
      id: null, 
      className: null, 
      caption: null, 
      thead: false, 
      hasEditColumn: false
    }
    ) {
    const tableElement = document.createElement("table");
    
    if (tableSettings.id) {
      tableElement.id = tableSettings.id;
    }
    if (tableSettings.className) {
      tableElement.classList.add(tableSettings.className);
    }
    if (tableSettings.caption) {
      const caption = tableElement.createCaption();
      caption.innerText = tableSettings.caption;
    }
    if (tableSettings.thead) {
      const thead = tableElement.createTHead();
      const headerRow = thead.insertRow();
      const nameHeader = headerRow.insertCell(0);
      const valueHeader = headerRow.insertCell(1);
      nameHeader.innerText = "Field Name";
      valueHeader.innerText = "Value";
      if (tableSettings.hasEditColumn) {
        const editHeader = headerRow.insertCell(2);
        editHeader.innerText = "Edit";
      }
    }
    tableElement.dataset.hasEditColumn = tableSettings.hasEditColumn;
    FormTableManager.updateTableBody(formElement, tableElement);
    return tableElement;
  }
}