/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type OfferCreateFormInputValues = {
    senderType?: string;
    amount?: number;
    status?: string;
};
export declare type OfferCreateFormValidationValues = {
    senderType?: ValidationFunction<string>;
    amount?: ValidationFunction<number>;
    status?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type OfferCreateFormOverridesProps = {
    OfferCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    senderType?: PrimitiveOverrideProps<TextFieldProps>;
    amount?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type OfferCreateFormProps = React.PropsWithChildren<{
    overrides?: OfferCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: OfferCreateFormInputValues) => OfferCreateFormInputValues;
    onSuccess?: (fields: OfferCreateFormInputValues) => void;
    onError?: (fields: OfferCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: OfferCreateFormInputValues) => OfferCreateFormInputValues;
    onValidate?: OfferCreateFormValidationValues;
} & React.CSSProperties>;
export default function OfferCreateForm(props: OfferCreateFormProps): React.ReactElement;
