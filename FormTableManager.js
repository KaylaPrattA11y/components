import FormManager from "./FormManager.js";

/**
 * @desc A class that provides methods for managing the form data table element
 * @class FormTableManager
 * @author Kayla Pratt
 */
class FormTableManager {
  /**
   * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} field 
   * @returns {string} The text of the table header for the field. This is used to identify the field in the form data table.
   */
  static getFieldNameText(field) {
    const fallbackLabel = field.name || field.id || "";
    if (field instanceof RadioNodeList) {
			const legendElement = field[0].closest("fieldset")?.querySelector("legend");
      return legendElement ? legendElement.innerText : fallbackLabel;
    } else {
      if (field.hasAttribute("aria-labelledby")) {
        const labelElement = document.getElementById(field.getAttribute("aria-labelledby"));
        return labelElement ? labelElement.innerText : fallbackLabel;
      }
      if (field.hasAttribute("aria-label")) {
        return field.getAttribute("aria-label");
      }
      if (field.id) {
        return document.querySelector(`label[for="${field.id}"]`)?.innerText;
      }
      if (field.closest("label")) {
        return field.closest("label").innerText;
      }
      return fallbackLabel;
    }
  }

  /**
   * @desc Updates the existing table's body with the latest form data
   * @param {HTMLFormElement} formElement
   * @param {HTMLTableElement} tableElement
   */
  static updateTableBody(formElement, tableElement) {
    const formData = FormManager.getFormData(formElement);
    const hasEditColumn = tableElement.dataset.hasEditColumn === "true";
    let tbody = tableElement.querySelector("tbody");
    
    if (tbody) {
      tbody.remove();
    }
		tbody = tableElement.createTBody();
    formData.forEach(field => {
      const row = tbody.insertRow();
      const nameCell = row.insertCell(0);
      const valueCell = row.insertCell(1);
      const fieldIsInvalid = formElement.elements[field.name]?.validity?.valid === false;
      const fieldName = FormTableManager.getFieldNameText(formElement.elements[field.name]);

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
      valueCell.innerText = field.value;
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
  static generateTable(formElement, tableSettings = {id: null, className: null, caption: null, thead: false, hasEditColumn: false}) {
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