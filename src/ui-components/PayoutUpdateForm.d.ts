/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Payout } from "../models";
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
export declare type PayoutUpdateFormInputValues = {
    courierID?: string;
    amount?: number;
    status?: string;
    bankName?: string;
    accountNumber?: string;
    reference?: string;
    walletID?: string;
};
export declare type PayoutUpdateFormValidationValues = {
    courierID?: ValidationFunction<string>;
    amount?: ValidationFunction<number>;
    status?: ValidationFunction<string>;
    bankName?: ValidationFunction<string>;
    accountNumber?: ValidationFunction<string>;
    reference?: ValidationFunction<string>;
    walletID?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PayoutUpdateFormOverridesProps = {
    PayoutUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    courierID?: PrimitiveOverrideProps<TextFieldProps>;
    amount?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    bankName?: PrimitiveOverrideProps<TextFieldProps>;
    accountNumber?: PrimitiveOverrideProps<TextFieldProps>;
    reference?: PrimitiveOverrideProps<TextFieldProps>;
    walletID?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type PayoutUpdateFormProps = React.PropsWithChildren<{
    overrides?: PayoutUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    payout?: Payout;
    onSubmit?: (fields: PayoutUpdateFormInputValues) => PayoutUpdateFormInputValues;
    onSuccess?: (fields: PayoutUpdateFormInputValues) => void;
    onError?: (fields: PayoutUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PayoutUpdateFormInputValues) => PayoutUpdateFormInputValues;
    onValidate?: PayoutUpdateFormValidationValues;
} & React.CSSProperties>;
export default function PayoutUpdateForm(props: PayoutUpdateFormProps): React.ReactElement;
