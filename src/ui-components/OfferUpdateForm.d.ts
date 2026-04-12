/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Offer } from "../models";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type OfferUpdateFormInputValues = {
    senderType?: string;
    amount?: number;
    status?: string;
};
export declare type OfferUpdateFormValidationValues = {
    senderType?: ValidationFunction<string>;
    amount?: ValidationFunction<number>;
    status?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type OfferUpdateFormOverridesProps = {
    OfferUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    senderType?: PrimitiveOverrideProps<TextFieldProps>;
    amount?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type OfferUpdateFormProps = React.PropsWithChildren<{
    overrides?: OfferUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    offer?: Offer;
    onSubmit?: (fields: OfferUpdateFormInputValues) => OfferUpdateFormInputValues;
    onSuccess?: (fields: OfferUpdateFormInputValues) => void;
    onError?: (fields: OfferUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: OfferUpdateFormInputValues) => OfferUpdateFormInputValues;
    onValidate?: OfferUpdateFormValidationValues;
} & React.CSSProperties>;
export default function OfferUpdateForm(props: OfferUpdateFormProps): React.ReactElement;
