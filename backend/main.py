import os
import uuid

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client

from analyzer import analyze_file


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Student Performance Analytics System",
    description="Cloud-based student performance analytics and prediction API",
    version="1.0.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "message": "Student Performance Analytics API is running"
    }


# ==========================================
# SUPABASE CONNECTION TEST
# ==========================================

@app.get("/test-supabase")
def test_supabase():

    try:

        response = (
            supabase
            .table("dataset_files")
            .select("id")
            .limit(1)
            .execute()
        )

        return {
            "status": "success",
            "message": "Successfully connected to Supabase",
            "data": response.data
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }

# ==========================================
# GET STORED DATASETS
# ==========================================

@app.get("/datasets")
def get_datasets():

    try:
        # Fetch only columns that actually exist in dataset_files.
        # The table does not require a created_at column.
        response = (
            supabase
            .table("dataset_files")
            .select(
                "id, file_name, file_type, file_size, "
                "row_count, column_count, processing_status, storage_path"
            )
            .execute()
        )

        datasets = response.data or []

        # Keep the API response compatible with the frontend.
        # No database column is required for this field.
        

        return {
            "success": True,
            "datasets": datasets
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


# ==========================================
# FILE ANALYSIS
# ==========================================

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...)
):

    # --------------------------------------
    # Read uploaded file
    # --------------------------------------

    file_data = await file.read()

    filename = file.filename

    # --------------------------------------
    # Validate filename
    # --------------------------------------

    if not filename:

        return {
            "success": False,
            "error": "No file selected."
        }


    # --------------------------------------
    # Analyze dataset
    # --------------------------------------

    result = analyze_file(
        file_data,
        filename
    )

    # --------------------------------------
    # Stop if analysis failed
    # --------------------------------------

    if not result.get("success"):

        return result


    try:

        # ----------------------------------
        # Generate unique storage filename
        # ----------------------------------

        file_extension = os.path.splitext(
            filename
        )[1].lower()

        unique_filename = (
            f"{uuid.uuid4()}{file_extension}"
        )

        storage_path = (
            f"uploads/{unique_filename}"
        )


        # ----------------------------------
        # Upload file to Supabase Storage
        # ----------------------------------

        supabase.storage \
            .from_("student-files") \
            .upload(
                storage_path,
                file_data,
                {
                    "content-type": (
                        file.content_type
                        or "application/octet-stream"
                    )
                }
            )


        # ----------------------------------
        # Create dataset record
        # ----------------------------------

        dataset_record = {

            "file_name": filename,

            "storage_path": storage_path,

            "file_type": file_extension,

            "file_size": len(file_data),

            "row_count": result["rows"],

            "column_count": result["columns"],

            "processing_status": "completed"
        }


        dataset_response = (
            supabase
            .table("dataset_files")
            .insert(dataset_record)
            .execute()
        )


        dataset_id = (
            dataset_response
            .data[0]["id"]
        )


        # ----------------------------------
        # Store column analysis
        # ----------------------------------

        column_records = []

        for column in result[
            "column_information"
        ]:

            column_records.append({

                "dataset_id": dataset_id,

                "column_name": column["name"],

                "data_type": column["data_type"],

                "missing_count": column[
                    "missing_values"
                ],

                "unique_count": column[
                    "unique_values"
                ],

                "is_numeric": (
                    column["name"]
                    in result["numeric_columns"]
                )
            })


        if column_records:

            (
                supabase
                .table("column_analysis")
                .insert(column_records)
                .execute()
            )


        # ----------------------------------
        # Store numeric statistics
        # ----------------------------------

        statistics_records = []

        for column, stats in result[
            "statistics"
        ].items():

            statistics_records.append({

                "dataset_id": dataset_id,

                "column_name": column,

                "count_value": stats["count"],

                "mean_value": stats["mean"],

                "median_value": stats["median"],

                "standard_deviation": stats["std"],

                "minimum_value": stats["minimum"],

                "maximum_value": stats["maximum"]
            })


        if statistics_records:

            (
                supabase
                .table("numeric_statistics")
                .insert(statistics_records)
                .execute()
            )


        # ----------------------------------
        # Store dataset insights
        # ----------------------------------

        insight_records = []

        for insight in result["insights"]:

            insight_records.append({

                "dataset_id": dataset_id,

                "insight_type": "automatic",

                "insight_text": insight
            })


        if insight_records:

            (
                supabase
                .table("dataset_insights")
                .insert(insight_records)
                .execute()
            )


        # ----------------------------------
        # Return complete result
        # ----------------------------------

        result["dataset_id"] = dataset_id

        result["storage_path"] = storage_path

        result["saved_to_supabase"] = True

        return result


    except Exception as e:

        return {

            "success": False,

            "saved_to_supabase": False,

            "error": (
                f"Supabase storage/database error: {str(e)}"
            )
        }