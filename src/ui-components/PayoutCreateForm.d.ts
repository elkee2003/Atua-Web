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
export declare type PayoutCreateFormInputValues = {
    courierID?: string;
    walletID?: string;
    amount?: number;
    status?: string;
    bankName?: string;
    accountNumber?: string;
    reference?: string;
    transferCode?: string;
    transferID?: string;
    failureReason?: string;
    payoutMethod?: string;
    processedAt?: string;
    paidAt?: string;
    failedAt?: string;
};
export declare type PayoutCreateFormValidationValues = {
    courierID?: ValidationFunction<string>;
    walletID?: ValidationFunction<string>;
    amount?: ValidationFunction<number>;
    status?: ValidationFunction<string>;
    bankName?: ValidationFunction<string>;
    accountNumber?: ValidationFunction<string>;
    reference?: ValidationFunction<string>;
    transferCode?: ValidationFunction<string>;
    transferID?: ValidationFunction<string>;
    failureReason?: ValidationFunction<string>;
    payoutMethod?: ValidationFunction<string>;
    processedAt?: ValidationFunction<string>;
    paidAt?: ValidationFunction<string>;
    failedAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PayoutCreateFormOverridesProps = {
    PayoutCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    courierID?: PrimitiveOverrideProps<TextFieldProps>;
    walletID?: PrimitiveOverrideProps<TextFieldProps>;
    amount?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    bankName?: PrimitiveOverrideProps<TextFieldProps>;
    accountNumber?: PrimitiveOverrideProps<TextFieldProps>;
    reference?: PrimitiveOverrideProps<TextFieldProps>;
    transferCode?: PrimitiveOverrideProps<TextFieldProps>;
    transferID?: PrimitiveOverrideProps<TextFieldProps>;
    failureReason?: PrimitiveOverrideProps<TextFieldProps>;
    payoutMethod?: PrimitiveOverrideProps<TextFieldProps>;
    processedAt?: PrimitiveOverrideProps<TextFieldProps>;
    paidAt?: PrimitiveOverrideProps<TextFieldProps>;
    failedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type PayoutCreateFormProps = React.PropsWithChildren<{
    overrides?: PayoutCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: PayoutCreateFormInputValues) => PayoutCreateFormInputValues;
    onSuccess?: (fields: PayoutCreateFormInputValues) => void;
    onError?: (fields: PayoutCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PayoutCreateFormInputValues) => PayoutCreateFormInputValues;
    onValidate?: PayoutCreateFormValidationValues;
} & React.CSSProperties>;
export default function PayoutCreateForm(props: PayoutCreateFormProps): React.ReactElement;
