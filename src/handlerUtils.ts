import { Response } from "express";
import { Task } from "fp-ts/Task";
import * as o from "fp-ts/Option";
import * as he from "@pagopa/cloudgaap-commons-ts/lib/encoders/httpEncoders";

const sendHttpResponse = (http: he.HttpResponse, toFill: Response): void => {
  const statusCode = http.statusCode;
  o.fold(
    () => toFill.status(statusCode).send({}),
    (body: he.Body) =>
      toFill.type(body.contentType).status(statusCode).send(body.payload)
  )(http.body);
};

const handleResponse = <T>(
  response: Response,
  result: Task<T>,
  encode: (t: T) => he.HttpResponse
): void => {
  result()
    .then(encode)
    .then((x) => sendHttpResponse(x, response));
  // TODO catch promise rejection
};

export { handleResponse };
