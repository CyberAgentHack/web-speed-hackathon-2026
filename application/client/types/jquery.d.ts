declare namespace JQuery {
  interface AjaxSettings {
    dataType?: "json" | "binary";
    responseType?: XMLHttpRequestResponseType;
  }

  interface jqXHR<T = unknown> {
    responseJSON?: T;
  }
}
