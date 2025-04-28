/* eslint-disable no-console */
import { validityStateToString } from "./utilities";

/**
 * @typedef {Object} FormFieldData
 * @property {string} name - The name of the form field.
 * @property {FormDataEntryValue} value - The value of the form field (string or File).
 */

/**
 * @typedef {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} FormControlElement
 */

/**
 * @typedef {'badInput' | 'customError' | 'patternMismatch' | 'rangeOverflow' | 'rangeUnderflow' | 'stepMismatch' | 'tooLong' | 'tooShort' | 'typeMismatch' | 'valid' | 'valueMissing'} ValidityStateKey
 */

/**
 * @typedef {Object} InvalidFieldData
 * @property {string} name
 * @property {string} value
 * @property {string} validity
 * @property {string} validationMessage
 */

/**
 * @typedef {Object} FieldsetData
 * @property {HTMLFieldSetElement} element
 * @property {HTMLLegendElement | null} legend
 * @property {string | undefined} legendText
 * @property {boolean} invalid
 */

/**
 * @desc Formats the console log message for the form
 * @param {HTMLFormElement} formElement
 * @param {String} message
 * @returns {void}
 */
function consoleLogFormatter(formElement, message = "") {
  const settings = {
    fontSize: "font-size: 20px;",
    formName: formElement.name || formElement.id,
  };
  return console.log(`%cForm "${settings.formName}" ${message}`, settings.fontSize);
}

export default class FormHelper {
  /**
   * Converts FormData from a form element into a simple key-value object.
   * Note: If multiple fields share the same name, the last value encountered by FormData typically wins.
   * @param {HTMLFormElement} formElement - The form element to process.
   * @returns {{ [key: string]: FormDataEntryValue }} An object representing the form data.
   */
  static getFormDataObject(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    formData.forEach((value, name) => {
      if (data[name]) {
        // combine values if the name already exists
        data[name] = Array.isArray(data[name]) ? [...data[name], value] : [data[name], value];
      } else {
        data[name] = value;
      }
    });
    return data;
  }

  /**
   * Gets an array of the names (keys) of all fields within the form's FormData.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {string[]} An array containing the names of the form fields.
   */
  static getFormDataKeys(formElement) {
    const formData = new FormData(formElement);
    return [...formData.keys()];
  }

  /**
   * Gets an array of the values of all fields within the form's FormData.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {FormDataEntryValue[]} An array containing the values (string or File) of the form fields.
   */
  static getFormDataValues(formElement) {
    const formData = new FormData(formElement);
    return [...formData.values()];
  }

  /**
   * Converts FormData into an array of objects, each containing a field's name and value.
   * Handles fields with the same name by creating separate entries for each.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {FormFieldData[]} An array of objects representing the form data entries.
   */
  static getFormDataArray(formElement) {
    const formData = new FormData(formElement);
    const data = [];
    formData.forEach((value, name) => {
      data.push({ name, value });
    });
    return data;
  }

  /**
   * Logs the `FormData` of a given form element to the console as a table.
   * @param {HTMLFormElement} formElement - The form element whose data should be logged.
   * @returns {void}
   */
  static logFormData(formElement) {
    consoleLogFormatter(formElement, "data:");
    console.table(FormHelper.getFormDataArray(formElement));
  }

  /**
   * Finds the first submit button (`<button type="submit">`) within the form.
   * @param {HTMLFormElement} formElement - The form element to search within.
   * @returns {HTMLButtonElement | null} The submit button element, or null if not found.
   */
  static getSubmit(formElement) {
    return formElement?.querySelector("button[type=submit]");
  }

  /**
   * Disables or enables the form's first submit button.
   * @param {HTMLFormElement} formElement - The form containing the submit button.
   * @param {boolean} [doDisable=true] - Set to `true` to disable, `false` to enable. Defaults to `true`.
   * @returns {void}
   */
  static disableSubmit(formElement, doDisable = true) {
    const submitButton = formElement?.querySelector("button[type=submit]");
    submitButton?.toggleAttribute("disabled", doDisable);
  }

  /**
   * Disables or enables all applicable form elements (input, select, textarea, button, fieldset) within the given form or fieldset.
   * @param {HTMLFormElement | HTMLFieldSetElement} formElement - The container element (<form> or <fieldset>).
   * @param {boolean} [doDisable=true] - Set to `true` to disable, `false` to enable. Defaults to `true`.
   * @returns {void}
   */
  static disableAllElements(formElement, doDisable = true) {
    const canBeDisabled = () =>
      formElement instanceof HTMLFieldSetElement ||
      formElement instanceof HTMLInputElement ||
      formElement instanceof HTMLTextAreaElement ||
      formElement instanceof HTMLSelectElement;
    const filtered = [...formElement.elements].filter(element => canBeDisabled(element));

    filtered.forEach(element => {
      const el = element;
      el.disabled = doDisable;
    });
  }

  /**
   * Makes all applicable form elements (input, textarea) within the form or fieldset read-only or writable.
   * @param {HTMLFormElement | HTMLFieldSetElement} formElement - The container element (<form> or <fieldset>).
   * @param {boolean} [doReadOnly=true] - Set to `true` to make read-only, `false` to make writable. Defaults to `true`.
   * @returns {void}
   */
  static makeAllElementsReadonly(formElement, doReadOnly = true) {
    const canBeReadOnly = () => formElement instanceof HTMLInputElement || formElement instanceof HTMLTextAreaElement;
    const filtered = [...formElement.elements].filter(element => canBeReadOnly(element));

    filtered.forEach(element => {
      const el = element;
      el.readOnly = doReadOnly;
    });
  }

  /**
   * Shows or hides a loading indicator state on the form's submit button.
   * Typically toggles a `data-is-busy` attribute and disables the button when shown.
   * @param {HTMLFormElement} formElement - The form containing the submit button.
   * @param {boolean} [doShow=true] - Set to `true` to show the loader, `false` to hide it. Defaults to `true`.
   * @returns {void}
   */
  static showSubmitLoader(formElement, doShow = true) {
    const submitButton = formElement?.querySelector("button[type=submit]");
    submitButton?.toggleAttribute("disabled", doShow);
    submitButton?.toggleAttribute("data-is-busy", doShow);
  }

  /**
   * Shows or hides the form's loading state, typically by setting ARIA attributes and optionally adding CSS classes.
   * @param {HTMLFormElement} formElement - The form element to apply the loading state to.
   * @param {boolean} [doShow=true] - Set to `true` to show loading state, `false` to hide. Defaults to `true`.
   * @param {boolean} [useSpinner=false] - If true, indicates a spinner/mask style might be applied via CSS (`.js-is-busy` class). Defaults to `false`.
   * @returns {void}
   */
  static showFormLoading(formElement, doShow = true, useSpinner = false) {
    formElement.setAttribute("aria-busy", doShow);
    formElement.setAttribute("aria-live", "polite");
    formElement.setAttribute("aria-atomic", "true");
    formElement.classList.toggle("js-is-busy", useSpinner);
    formElement.setAttribute("data-loading", "");
  }

  /**
   * Compares two FormData objects entry by entry to determine if they contain the same keys and values.
   * Order of entries does not matter. Useful for checking if form state has changed.
   * @param {FormData} formData1 - The first FormData object.
   * @param {FormData} formData2 - The second FormData object.
   * @returns {boolean} `true` if the FormData objects are effectively equal, `false` otherwise.
   */
  static formDataMatches(formData1, formData2) {
    const entries1 = [...formData1.entries()];
    const entries2 = [...formData2.entries()];

    if (entries1.length !== entries2.length) return false;

    return entries1.every(([key, value]) => {
      const matchingEntry = entries2.find(([key2]) => key === key2);
      return matchingEntry && value === matchingEntry[1];
    });
  }

  /**
   * Finds and returns all form elements within a form that are currently invalid based on their validity state.
   * @param {HTMLFormElement} formElement - The form element to check.
   * @param {ValidityStateKey[]} [validityState=[]] - Optional array of specific validity state keys (e.g., `['valueMissing', 'typeMismatch']`). If provided, only fields matching one of these states are returned. Defaults to checking for any invalid state (`!validity.valid`).
   * @param {boolean} [excludeDisabledFields=true] - If true, ignores disabled fields. Defaults to `true`.
   * @returns {FormControlElement[]} An array of invalid form control elements.
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
   * Returns detailed data about invalid form fields, including name, value, validity state string, and validation message.
   * @param {HTMLFormElement} formElement - The form element to check.
   * @param {ValidityStateKey[]} [validityState=[]] - Optional array of validity states to filter by.
   * @param {boolean} [excludeDisabledFields=true] - If true, ignores disabled fields. Defaults to `true`.
   * @returns {InvalidFieldData[]} An array of objects containing details about each invalid field.
   */
  static getInvalidFieldsData(formElement, validityState = [], excludeDisabledFields = true) {
    return FormHelper.getInvalidFields(formElement, validityState, excludeDisabledFields).map(field => ({
      name: field.name,
      value: field.value,
      validity: validityStateToString(field),
      validationMessage: field.validationMessage,
    }));
  }

  /**
   * Logs detailed data about invalid form fields to the console as a table.
   * @param {HTMLFormElement} formElement - The form element to check.
   * @param {ValidityStateKey[]} [validityState=[]] - Optional array of validity states to filter by.
   * @param {boolean} [excludeDisabledFields=true] - If true, ignores disabled fields. Defaults to `true`.
   * @returns {void}
   */
  static logInvalidFieldsData(formElement, validityState = [], excludeDisabledFields = true) {
    consoleLogFormatter(formElement, "invalid fields data:");
    console.table(FormHelper.getInvalidFieldsData(formElement, validityState, excludeDisabledFields));
  }

  /**
   * Returns all form elements within the form that have the `required` attribute.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {FormControlElement[]} An array of required form control elements.
   */
  static getRequiredFields(formElement) {
    return [...formElement.elements].filter(element => element.required);
  }

  /**
   * Returns all form elements within the form that are currently disabled.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {FormControlElement[]} An array of disabled form control elements.
   */
  static getDisabledFields(formElement) {
    return [...formElement.elements].filter(element => element.disabled);
  }

  /**
   * Returns all form elements (input, textarea) within the form that are currently read-only.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {(HTMLInputElement | HTMLTextAreaElement)[]} An array of read-only elements.
   */
  static getReadonlyFields(formElement) {
    return [...formElement.elements].filter(element => element.readOnly);
  }

  /**
   * Returns all fieldset elements found within the form's elements collection.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLFieldSetElement[]} An array of fieldset elements.
   */
  static getFieldsets(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "FIELDSET");
  }

  /**
   * Returns detailed data about each fieldset within the form, including the element, legend, and validity state.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {FieldsetData[]} An array of objects containing details about each fieldset.
   */
  static getFieldsetsData(formElement) {
    const fieldsetElements = FormHelper.getFieldsets(formElement);
    return [...fieldsetElements].map(fieldset => ({
      element: fieldset,
      legend: fieldset.querySelector("legend"),
      legendText: fieldset.querySelector("legend")?.innerText,
      invalid: fieldset.matches(":invalid"),
    }));
  }

  /**
   * Returns all `<input>` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLInputElement[]} An array of input elements.
   */
  static getAllInputs(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "INPUT");
  }

  /**
   * Returns all `<textarea>` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLTextAreaElement[]} An array of textarea elements.
   */
  static getAllTextareas(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "TEXTAREA");
  }

  /**
   * Returns all `<select>` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLSelectElement[]} An array of select elements.
   */
  static getAllSelects(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "SELECT");
  }

  /**
   * Returns all `input[type="number"]` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLInputElement[]} An array of number input elements.
   */
  static getAllNumberInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "number");
  }

  /**
   * Returns all `input[type="email"]` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLInputElement[]} An array of email input elements.
   */
  static getAllEmailInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "email");
  }

  /**
   * Returns all `input[type="hidden"]` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLInputElement[]} An array of hidden input elements.
   */
  static getAllHiddenInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "hidden");
  }

  /**
   * Returns all `input[type="checkbox"]` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLInputElement[]} An array of checkbox input elements.
   */
  static getAllCheckboxes(formElement) {
    return [...formElement.elements].filter(element => element.type === "checkbox");
  }

  /**
   * Returns all `input[type="radio"]` elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {HTMLInputElement[]} An array of radio input elements.
   */
  static getAllRadios(formElement) {
    return [...formElement.elements].filter(element => element.type === "radio");
  }

  /**
   * Resets a specific form field (input, select, textarea) or a RadioNodeList to its default value.
   * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | RadioNodeList} fieldElement - The field element or radio node list to reset.
   * @returns {void}
   */
  static resetField(fieldElement) {
    fieldElement.setAttribute("value", fieldElement.defaultValue);
  }

  /**
   * Clears any custom validity messages set via `setCustomValidity("")` on all elements within the form.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {void}
   */
  static clearAllCustomValidity(formElement) {
    [...formElement.elements].forEach(element => {
      element.setCustomValidity("");
    });
  }

  /**
   * Sets the `defaultValue` property of each form element to match its current `value`.
   * Useful for establishing a baseline for "dirty" checking after initial population.
   * @param {HTMLFormElement} formElement - The form element.
   * @returns {void}
   */
  static initializeDefaultValues(formElement) {
    [...formElement.elements].forEach(element => {
      const el = element;
      if (el instanceof HTMLSelectElement) {
        const selected = el.options[el.selectedIndex];
        if (selected) {
          selected.defaultSelected = true;
        }
      } else if (el instanceof RadioNodeList) {
        const checkedRadio = [...el].find(radio => radio.checked);
        if (checkedRadio) {
          checkedRadio.defaultChecked = true;
        }
      } else {
        el.defaultValue = element.value == null || element.value === "null" ? "" : element.value;
      }
    });
  }

  /**
   * Determines if a form is "dirty" (changed from its default values).
   * Compares the current `value` of each element to its `defaultValue`.
   * @param {HTMLFormElement} formElement - The form element to check.
   * @param {boolean} [logDifferences=false] - If true, logs the differing fields and their values to the console. Defaults to `false`.
   * @returns {boolean} `true` if any element's value differs from its defaultValue, `false` otherwise.
   */
  static isDirty(formElement, logDifferences = false) {
    const allDefaultValues = [...formElement.elements].map(element => {
      if (element instanceof RadioNodeList) {
        // For RadioNodeList, find the checked radio button's value for the defaultValue
        const checkedRadio = [...element].find(radio => radio.checked);
        if (checkedRadio) {
          return checkedRadio.defaultValue;
        }
        return "";
      }
      return element.defaultValue == null || element.defaultValue === "null" ? "" : element.defaultValue;
    });
    const allCurrentValues = [...formElement.elements].map(element => {
      if (element instanceof RadioNodeList) {
        // For RadioNodeList, find the checked radio button's value
        const checkedRadio = [...element].find(radio => radio.checked);
        if (checkedRadio) {
          return checkedRadio.value;
        }
        return "";
      }
      return element.value == null || element.value === "null" ? "" : element.value;
    });
    const isDirty = !allDefaultValues.every((defaultValue, index) => defaultValue === allCurrentValues[index]);

    if (logDifferences) {
      const diffMap = allDefaultValues.map((defaultValue, index) => {
        const currentValue = allCurrentValues[index];
        return defaultValue !== currentValue
          ? { name: formElement.elements[index].name, defaultValue, currentValue }
          : "";
      });

      consoleLogFormatter(formElement, "differences:");
      console.table(diffMap.filter(Boolean));
    }
    return isDirty;
  }

  /**
   * Trims whitespace from the beginning and end of a string value.
   * Handles strings, arrays of strings (trimming each element), and object values (trimming string properties).
   * @template T - The type of the value being passed (string, array, or object).
   * @param {T} value - The value to trim.
   * @returns {T} The value with string(s) trimmed. Note: Modifies objects and arrays in place if they contain strings.
   */
  static trimValue(value) {
    if (typeof value === "string") {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === "string") {
          item.trim();
        }
        return item;
      });
    }
    if (typeof value === "object" && value !== null) {
      Object.entries(value).forEach(([key, item]) => {
        if (typeof item === "string") {
          value[key] = item.trim();
        }
      });
    }
    return value;
  }

  /**
   * Populates form fields based on matching keys in a data object.
   * Handles inputs, textareas, selects, radio buttons, and potentially checkboxes (if value is an array).
   * @param {HTMLFormElement} formElement - The form element to populate.
   * @param {object} obj - An object where keys match form field names and values are the data to populate with (e.g., `{ firstName: "Julie", options: ["A", "C"] }`).
   * @param {boolean} [setAsDefaultValues=true] - If true, also sets the `defaultValue` of the populated fields. Defaults to `true`.
   * @returns {void}
   */
  static populateFormFieldsWithObject(formElement, obj, setAsDefaultValues = true) {
    if (!obj) return;
    Object.entries(obj).forEach(([key, value]) => {
      const element = formElement.elements.namedItem(key);
      const isRadio = element instanceof RadioNodeList;
      const isSelect = element instanceof HTMLSelectElement;
      const trimmedValue = FormHelper.trimValue(value);

      if (!element) return;
      if (isRadio) {
        if (Array.isArray(trimmedValue)) {
          // Handle array of values for checkboxes (multiple checkboxes with the same name)
          const checkboxes = [...element].filter(r => trimmedValue.includes(r.value));
          checkboxes?.forEach(checkbox => {
            checkbox.setAttribute("checked", true);
          });
        } else {
          const radio = [...element].find(r => r.value === trimmedValue);
          if (radio) {
            radio.checked = true;
          }
        }
      } else if (isSelect) {
        element.value = trimmedValue;
        const option = element.options[element.selectedIndex];
        if (option) {
          option.selected = true;
        }
      } else {
        element.value = trimmedValue;
      }
      if (setAsDefaultValues) {
        element.defaultValue = trimmedValue;
      }
    });
  }
}
