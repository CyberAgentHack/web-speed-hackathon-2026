declare namespace JQuery {
  interface AjaxSettings {
    dataType?: "json" | "binary";
    responseType?: XMLHttpRequestResponseType;
  }
}

declare module "jquery-binarytransport";
