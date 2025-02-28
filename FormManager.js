/**
 * @desc A class that provides methods for managing forms and form elements
 * @class FormManager
 * @author Kayla Pratt
 */
class FormManager {
	/**
   * @desc Gets the `FormData` of a given form element
   * @param {HTMLFormElement} formElement
	 * @returns {Object[]}
   */
  static getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = [];
    formData.forEach((value, name) => {
      data.push({ name, value });
    });
		return data;
  }
	
	/**
   * @desc Gets the `FormData` of a given form element
   * @param {HTMLFormElement} formElement
   * @param {Object} tableSettings
   * @param {string|null} tableSettings.caption Add a string to the table caption. Optional
   * @param {string} tableSettings.className Add a class name to the table. Optional
   * @param {string} tableSettings.id Add an id to the table. Optional
   * @returns {HTMLTableElement} A table element with the form data
   */
  static getFormDataTable(formElement, tableSettings = {}) {
    const formData = FormManager.getFormData(formElement);
    const tableElement = document.createElement("table");
		
    if (tableSettings.caption) {
      const caption = document.createElement("caption");
      caption.innerText = tableSettings.caption;
      tableElement.appendChild(caption);
    }
    if (tableSettings.className) {
      tableElement.className = tableSettings.className;
    }
    if (tableSettings.id) {
      tableElement.id = tableSettings.id;
    }
    formData.forEach(field => {
      const row = tableElement.insertRow();
      const nameCell = row.insertCell(0);
      const valueCell = row.insertCell(1);
      const fieldIsInvalid = formElement.elements[field.name]?.validity?.valid === false;
			
      row.classList.toggle("is-invalid", fieldIsInvalid);
      nameCell.innerText = field.name;
      valueCell.innerText = field.value;
    });
		return tableElement;
  }
	
  /**
   * @desc Logs the `FormData` of a given form element to the console
   * @param {HTMLFormElement} formElement
   */
  static logFormData(formElement) {
    console.table(FormManager.getFormData(formElement));
  }

  /**
   * @desc Get the form submit button
   * @param {HTMLFormElement} formElement
   * @returns {HTMLButtonElement | HTMLInputElement} The submit button element
   */
  static getSubmit(formElement) {
    return formElement?.querySelector("button[type=submit]");
  }

  /**
   * @desc Disable or enable the form submit button
   * @param {HTMLFormElement} formElement
   * @param {boolean} doDisable default `true`
   */
  static disableSubmit(formElement, doDisable = true) {
    const submitButton = formElement?.querySelector("button[type=submit]");
    submitButton?.toggleAttribute("disabled", doDisable);
  }

  /**
   * @desc Disable or enable all applicable form elements within the form or fieldset
   * @param {HTMLFormElement | HTMLFieldSetElement} formElement The <form|fieldset> container
   * @param {boolean} doDisable default `true`
   */
  static disableAllElements(formElement, doDisable = true) {
    if (formElement instanceof HTMLFieldSetElement) {
      const fieldset = formElement;
      fieldset.disabled = doDisable;
    }
    if (formElement && formElement.elements) {
      Array.from(formElement.elements).forEach(element => {
        const el = element;
        el.disabled = doDisable;
      });
    }
  }

  /**
   * @desc Show or hide the form submit button's loading spinner. Disables the button when shown
   * @param {HTMLFormElement} formElement
   * @param {boolean} doShow default `true`
   */
  static showSubmitLoader(formElement, doShow = true) {
    const submitButton = formElement?.querySelector("button[type=submit]");
    submitButton?.toggleAttribute("disabled", doShow);
    submitButton?.toggleAttribute("data-is-busy", doShow);
  }

  /**
   * @desc Compares two FormData objects to see if they are equal. Use an initial form data object and a new form data object to determine if the form state is "clean" (`true`) or "dirty" (`false`).
   * @param {FormData} formData1
   * @param {FormData} formData2
   * @returns `true` if the two FormData objects are equal, `false` otherwise.
   */
  static formDataMatches(formData1, formData2) {
    const entries1 = [...formData1.entries()];
    const entries2 = [...formData2.entries()];

    if (entries1.length !== entries2.length) return false;

    return entries1.every(([key, value]) => {
      const matchingEntry = entries2.find(([key2, value2]) => key === key2);
      return matchingEntry && value === matchingEntry[1];
    });
  }

  /**
   * @desc Returns all invalid form elements
   * @param {HTMLFormElement} formElement
   * * @param {string[] | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing"} validityState An array of validity states to filter the invalid fields by. Leave empty to log all invalid fields.
   * @param {boolean} excludeDisabledFields If true, excludes disabled fields from the list of invalid fields. Default is true.
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getInvalidFields(formElement, validityState = [], excludeDisabledFields = true) {
    let invalidFields = [...formElement.elements].filter(element => !element.validity.valid);
    if (excludeDisabledFields) {
      invalidFields = invalidFields.filter(field => !field.disabled);
    }
    if (validityState.length > 0) {
      invalidFields = invalidFields.filter(field => validityState.some(state => field.validity[state]));
    }
    return invalidFields;
  }

  /**
   * @desc Returns a string of the validity states that are true for the field (validation errors)
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field 
   * @returns {string} A string of the validity states that are true for the field (validation errors)
   */
  static validityStateToString = field => {
    const array = [];
    // It needs to be done this way to map ValidityState values
    // eslint-disable-next-line no-restricted-syntax
    for (const key in field.validity) {
      if (field.validity[key] && key !== "valid") {
        array.push(key);
      }
    }
    return array.join(", ");
  }

  /**
   * @desc Returns all invalid form elements, along with their names, values, and validation messages
   * @param {HTMLFormElement} formElement
   * @param {string[] | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing"} validityState An array of validity states to filter the invalid fields by. Leave empty to log all invalid fields.
   * @param {boolean} excludeDisabledFields If true, excludes disabled fields from the list of invalid fields. Default is true.
   * @returns {object[]}
   */
  static getInvalidFieldsData(formElement, validityState = [], excludeDisabledFields = true) {
    return FormManager.getInvalidFields(formElement, validityState, excludeDisabledFields).map(field => ({
      name: field.name,
      value: field.value,
      validity: FormManager.validityStateToString(field),
      validationMessage: field.validationMessage,
    }));
  }

  /**
   * @desc Logs the invalid form fields data to the console
   * @param {HTMLFormElement} formElement 
   * @param {string[] | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing"} validityState An array of validity states to filter the invalid fields by. Leave empty to log all invalid fields.
   * @param {boolean} excludeDisabledFields If true, excludes disabled fields from the list of invalid fields. Default is true.
   */
  static logInvalidFieldsData(formElement, validityState = [], excludeDisabledFields = true) {
    console.table(FormManager.getInvalidFieldsData(formElement, validityState, excludeDisabledFields));
  }

  /**
   * @desc Returns all required form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getRequiredFields(formElement) {
    return [...formElement.elements].filter(element => element.required);
  }

  /**
   * @desc Returns all disabled form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getDisabledFields(formElement) {
    return [...formElement.elements].filter(element => element.disabled);
  }

  /**
   * @desc Returns all readonly form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getReadonlyFields(formElement) {
    return [...formElement.elements].filter(element => element.readonly);
  }

  /**
   * @desc Returns all form fieldset elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLFieldSetElement[]}
   */
  static getFieldsets(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "FIELDSET");
  }

  /**
   * @desc Returns data about every `<fieldset>` within the form element
   * @param {HTMLFormElement} formElement
   * @returns {Object[]}
   */
  static getFieldsetsData(formElement) {
    const fieldsetElements = FormManager.getFieldsets(formElement);
    return [...fieldsetElements].map(fieldset => ({
      element: fieldset,
      legend: fieldset.querySelector("legend"),
      legendText: fieldset.querySelector("legend")?.innerText,
      invalid: fieldset.matches(":invalid"),
    }));
  }

  /**
   * @desc Returns all `<input>` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllInputs(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "INPUT");
  }

  /**
   * @desc Returns all `<textarea>` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLTextAreaElement[]}
   */
  static getAllTextareas(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "TEXTAREA");
  }

  /**
   * @desc Returns all `<select>` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLSelectElement[]}
   */
  static getAllSelects(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "SELECT");
  }

  /**
   * @desc Returns all `input[type="number"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllNumberInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "number");
  }

  /**
   * @desc Returns all `input[type="email"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllEmailInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "email");
  }

  /**
   * @desc Returns all `input[type="hidden"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllHiddenInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "hidden");
  }

  /**
   * @desc Returns all `input[type="checkbox"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllCheckboxes(formElement) {
    return [...formElement.elements].filter(element => element.type === "checkbox");
  }

  /**
   * @desc Returns all `input[type="radio"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllRadios(formElement) {
    return [...formElement.elements].filter(element => element.type === "radio");
  }

  /**
   * @desc Clears the custom validity message for all form elements
   * @param {HTMLFormElement} formElement 
   */
  static clearAllCustomValidity(formElement) {
    [...formElement.elements].forEach(element => {
      element.setCustomValidity("");
    });
  }

  /**
   * @desc Pass an object and convert it to a `FormData` object
   * @param {object} obj
   * @returns {FormData}
   */
  static convertObjectToFormData(obj) {
    return Object.entries(obj).reduce((formData, [key, value]) => {
      formData.append(key, value);
      return formData;
    }, new FormData());
  }

}