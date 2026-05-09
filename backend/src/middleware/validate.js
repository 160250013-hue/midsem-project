import { HttpError } from "../utils/httpError.js";

export const validate = (schema, source = "body") => (req, _res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join(", ");
    return next(new HttpError(422, messages));
  }

  req[source] = value;
  next();
};
