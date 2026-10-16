import pandas as pd
from io import BytesIO


ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def analyze_file(file_data, filename):

    # -----------------------------
    # 1. Validate file extension
    # -----------------------------

    filename_lower = filename.lower()

    if not any(filename_lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return {
            "success": False,
            "error": "Unsupported file type. Please upload CSV or Excel."
        }

    try:

        # -----------------------------
        # 2. Read the uploaded file
        # -----------------------------

        if filename_lower.endswith(".csv"):

            df = pd.read_csv(
                BytesIO(file_data)
            )

        else:

            df = pd.read_excel(
                BytesIO(file_data)
            )

        # -----------------------------
        # 3. Basic dataset information
        # -----------------------------

        rows, columns = df.shape

        # -----------------------------
        # 4. Column information
        # -----------------------------

        column_information = []

        for column in df.columns:

            column_information.append({
                "name": str(column),
                "data_type": str(df[column].dtype),
                "missing_values": int(df[column].isna().sum()),
                "unique_values": int(df[column].nunique())
            })

        # -----------------------------
        # 5. Duplicate records
        # -----------------------------

        duplicate_count = int(
            df.duplicated().sum()
        )

        # -----------------------------
        # 6. Numeric columns
        # -----------------------------

        numeric_columns = (
            df.select_dtypes(include="number")
            .columns
            .tolist()
        )

        # -----------------------------
        # 7. Numeric statistics
        # -----------------------------

        statistics = {}

        for column in numeric_columns:

            statistics[column] = {
                "count": int(df[column].count()),
                "mean": round(
                    float(df[column].mean()), 2
                ),
                "median": round(
                    float(df[column].median()), 2
                ),
                "std": round(
                    float(df[column].std()), 2
                ),
                "minimum": round(
                    float(df[column].min()), 2
                ),
                "maximum": round(
                    float(df[column].max()), 2
                )
            }

        # -----------------------------
        # 8. Missing values summary
        # -----------------------------

        total_missing = int(
            df.isna().sum().sum()
        )

        # -----------------------------
        # 9. Dataset insights
        # -----------------------------

        insights = []

        insights.append(
            f"The dataset contains {rows} rows and {columns} columns."
        )

        insights.append(
            f"The dataset contains {duplicate_count} duplicate records."
        )

        insights.append(
            f"The dataset contains {total_missing} missing values."
        )

        if numeric_columns:

            highest_mean_column = max(
                numeric_columns,
                key=lambda col: df[col].mean()
            )

            lowest_mean_column = min(
                numeric_columns,
                key=lambda col: df[col].mean()
            )

            insights.append(
                f"{highest_mean_column} has the highest average "
                f"value of {df[highest_mean_column].mean():.2f}."
            )

            insights.append(
                f"{lowest_mean_column} has the lowest average "
                f"value of {df[lowest_mean_column].mean():.2f}."
            )


                # -----------------------------
        # 9.5. Student predictions
        # -----------------------------

        predictions = []

        # Use numeric columns other than attendance
        score_columns = [
            column for column in numeric_columns
            if "attendance" not in str(column).lower()
        ]

        # Use the first text column as student identifier
        identifier_column = None

        for column in df.columns:
            if df[column].dtype == "object":
                identifier_column = column
                break

        if score_columns:

            for index, row in df.iterrows():

                scores = pd.to_numeric(
                    row[score_columns],
                    errors="coerce"
                )

                valid_scores = scores.dropna()

                if len(valid_scores) == 0:
                    continue

                prediction_score = round(
                    float(valid_scores.mean()), 2
                )

                if prediction_score >= 80:
                    predicted_category = "Excellent"

                elif prediction_score >= 60:
                    predicted_category = "Good"

                elif prediction_score >= 40:
                    predicted_category = "Average"

                else:
                    predicted_category = "Needs Improvement"

                if identifier_column:
                    student_identifier = str(
                        row[identifier_column]
                    )
                else:
                    student_identifier = f"Student {index + 1}"

                predictions.append({
                    "student_identifier": student_identifier,
                    "predicted_category": predicted_category,
                    "prediction_score": prediction_score
                })
        

        # -----------------------------
        # 10. Final result
        # -----------------------------

        return {
    "success": True,
    "filename": filename,
    "rows": rows,
    "columns": columns,
    "column_names": [
        str(column)
        for column in df.columns
    ],
    "column_information": column_information,
    "numeric_columns": numeric_columns,
    "duplicate_records": duplicate_count,
    "total_missing_values": total_missing,
    "statistics": statistics,
    "insights": insights
}

    except Exception as e:

        return {
            "success": False,
            "error": f"Unable to process file: {str(e)}"
        }