const API_URL = "https://student-performance-analytics-6593.onrender.com";
/* =========================================
   SUPABASE AUTHENTICATION
========================================= */

const SUPABASE_URL = "https://muceaquspqvwywwztjlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_-MRiiCz194PDw0MLMaLu1g__hQCpSt8";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const loginScreen = document.getElementById("loginScreen");
const appLayout = document.getElementById("appLayout");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
/* =========================================
   ELEMENTS
========================================= */

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const analyzeButton = document.getElementById("analyzeButton");
const statusMessage = document.getElementById("statusMessage");

const navItems = document.querySelectorAll(".nav-item");
const pageSections = document.querySelectorAll(".page-section");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const logoutButton = document.getElementById("logoutButton");


/* =========================================
   NAVIGATION
========================================= */

const pageInformation = {

    dashboardSection: {
        title: "Dashboard",
        subtitle: "Monitor your student data and analysis."
    },

    uploadSection: {
        title: "Analyze Dataset",
        subtitle: "Upload a dataset and generate meaningful insights."
    },

    resultsSection: {
        title: "Dataset Analysis",
        subtitle: "View detailed statistics and insights."
    },

    datasetsSection: {
        title: "Dataset History",
        subtitle: "View your previously processed datasets."
    }

};


function showSection(sectionId) {

    pageSections.forEach(section => {

        section.classList.add("hidden");
        section.classList.remove("active-section");

    });


    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {

        selectedSection.classList.remove("hidden");
        selectedSection.classList.add("active-section");

    }


    navItems.forEach(item => {

        item.classList.remove("active");

        if (item.dataset.section === sectionId) {
            item.classList.add("active");
        }

    });


    const information = pageInformation[sectionId];

    if (information) {

        pageTitle.textContent = information.title;
        pageSubtitle.textContent = information.subtitle;

    }


    if (sectionId === "datasetsSection") {
        loadDatasets();
    }

    if (sectionId === "dashboardSection") {
        loadDashboard();
    }

}


/* =========================================
   NAVIGATION BUTTON EVENTS
========================================= */

navItems.forEach(item => {

    item.addEventListener("click", () => {

        const sectionId = item.dataset.section;

        showSection(sectionId);

    });

});


/* =========================================
   BUTTONS THAT OPEN SECTIONS
========================================= */

document
    .querySelectorAll("[data-section]")
    .forEach(button => {

        if (button.classList.contains("nav-item")) {
            return;
        }

        button.addEventListener("click", () => {

            const sectionId =
                button.dataset.section;

            showSection(sectionId);

        });

    });


/* =========================================
   FILE SELECTION
========================================= */

if (fileInput) {

    fileInput.addEventListener("change", () => {

        if (fileInput.files.length > 0) {

            fileName.textContent =
                fileInput.files[0].name;

            fileName.style.color = "#2563eb";

        } else {

            fileName.textContent =
                "No file selected";

            fileName.style.color = "";

        }

    });

}


/* =========================================
   ANALYZE DATASET
========================================= */

if (analyzeButton) {

    analyzeButton.addEventListener("click", async () => {

        if (!fileInput.files.length) {

            statusMessage.textContent =
                "Please select a CSV or Excel file.";

            statusMessage.style.color = "#dc2626";

            return;
        }


        const file = fileInput.files[0];

        const formData = new FormData();

        formData.append("file", file);


        analyzeButton.disabled = true;

        analyzeButton.textContent =
            "Analyzing Dataset...";

        statusMessage.textContent =
            "Processing your dataset. Please wait...";

        statusMessage.style.color =
            "#2563eb";


        try {

            const response = await fetch(
                `${API_URL}/analyze`,
                {
                    method: "POST",
                    body: formData
                }
            );


            const result = await response.json();


            if (!response.ok || !result.success) {

                throw new Error(
                    result.error ||
                    "Unable to analyze dataset."
                );

            }


            /* =========================
               DISPLAY ANALYSIS
            ========================= */

            displayAnalysis(result);


            statusMessage.textContent =
                "Dataset analyzed successfully.";

            statusMessage.style.color =
                "#16a34a";


            /* =========================
               OPEN RESULTS
            ========================= */

            showSection("resultsSection");


            /* =========================
               REFRESH DASHBOARD DATA
            ========================= */

            loadDashboard();


        } catch (error) {

            console.error(error);

            statusMessage.textContent =
                error.message ||
                "Something went wrong.";

            statusMessage.style.color =
                "#dc2626";

        } finally {

            analyzeButton.disabled = false;

            analyzeButton.textContent =
                "Analyze Dataset";

        }

    });

}


/* =========================================
   DISPLAY ANALYSIS
========================================= */

function displayAnalysis(result) {

    /* -----------------------------
       Summary
    ----------------------------- */

    const rowCount =
        document.getElementById("rowCount");

    const columnCount =
        document.getElementById("columnCount");

    const numericCount =
        document.getElementById("numericCount");

    const missingCount =
        document.getElementById("missingCount");

    const duplicateCount =
        document.getElementById("duplicateCount");


    if (rowCount)
        rowCount.textContent =
            result.rows ?? 0;

    if (columnCount)
        columnCount.textContent =
            result.columns ?? 0;

    if (numericCount)
        numericCount.textContent =
            result.numeric_columns?.length ?? 0;

    if (missingCount)
        missingCount.textContent =
            result.total_missing_values ?? 0;

    if (duplicateCount)
        duplicateCount.textContent =
            result.duplicate_records ?? 0;


    /* -----------------------------
       Column list
    ----------------------------- */

    const columnList =
        document.getElementById("columnList");

    if (columnList) {

        columnList.innerHTML = "";

        (result.column_names || [])
            .forEach(column => {

                const tag =
                    document.createElement("div");

                tag.className =
                    "column-tag";

                tag.textContent =
                    column;

                columnList.appendChild(tag);

            });

    }


    /* -----------------------------
       Statistics
    ----------------------------- */

    const statisticsContainer =
        document.getElementById(
            "statisticsContainer"
        );

    if (statisticsContainer) {

        const statistics =
            result.statistics || {};

        const columns =
            Object.keys(statistics);


        if (!columns.length) {

            statisticsContainer.innerHTML =
                `<div class="empty-message">
                    No numeric fields available.
                </div>`;

        } else {

            let table = `
                <table class="stat-table">

                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Count</th>
                            <th>Mean</th>
                            <th>Median</th>
                            <th>Std. Dev.</th>
                            <th>Minimum</th>
                            <th>Maximum</th>
                        </tr>
                    </thead>

                    <tbody>
            `;


            columns.forEach(column => {

                const stats =
                    statistics[column];


                table += `
                    <tr>

                        <td>${escapeHTML(column)}</td>

                        <td>${stats.count}</td>

                        <td>${stats.mean}</td>

                        <td>${stats.median}</td>

                        <td>${stats.std}</td>

                        <td>${stats.minimum}</td>

                        <td>${stats.maximum}</td>

                    </tr>
                `;

            });


            table += `
                    </tbody>
                </table>
            `;


            statisticsContainer.innerHTML =
                table;

        }

    }


    /* -----------------------------
       Insights
    ----------------------------- */

    const insightsContainer =
        document.getElementById(
            "insightsContainer"
        );


    if (insightsContainer) {

        insightsContainer.innerHTML = "";


        const insights =
            result.insights || [];


        if (!insights.length) {

            insightsContainer.innerHTML =
                `<div class="empty-message">
                    No insights available.
                </div>`;

        } else {

            insights.forEach(insight => {

                const item =
                    document.createElement("div");

                item.className =
                    "insight-item";


                item.innerHTML = `
                    <div class="insight-icon">
                        ✓
                    </div>

                    <div>
                        ${escapeHTML(insight)}
                    </div>
                `;


                insightsContainer.appendChild(item);

            });

        }

    }

}


/* =========================================
   LOAD DATASETS
========================================= */

async function loadDatasets() {

    try {

        const response =
            await fetch(`${API_URL}/datasets`);


        const result =
            await response.json();


        if (!result.success) {

            console.error(
                result.error
            );

            return;

        }


        const datasets =
            result.datasets || [];


        displayDatasetHistory(
            datasets
        );


    } catch (error) {

        console.error(
            "Unable to load datasets:",
            error
        );

    }

}


/* =========================================
   DATASET HISTORY
========================================= */

function displayDatasetHistory(datasets) {

    const container =
        document.getElementById(
            "datasetHistoryContainer"
        );


    if (!container) return;


    if (!datasets.length) {

        container.innerHTML =
            `<div class="empty-message">
                No datasets available.
            </div>`;

        return;

    }


    container.innerHTML = "";


    datasets.forEach(dataset => {

        const row =
            document.createElement("div");

        row.className =
            "dataset-row";


        row.innerHTML = `

            <div>
                <div class="dataset-name">
                    ${escapeHTML(
                        dataset.file_name || "Dataset"
                    )}
                </div>

                <div class="dataset-meta">
                    ${dataset.row_count ?? 0}
                    records ·
                    ${dataset.column_count ?? 0}
                    columns
                </div>
            </div>


            <div class="dataset-meta">
                ${escapeHTML(
                    dataset.file_type || "—"
                )}
            </div>


            <div>
                <span class="dataset-status">
                    ${escapeHTML(
                        dataset.processing_status ||
                        "Completed"
                    )}
                </span>
            </div>


            <div class="dataset-meta">
                ${formatDate(
                    dataset.created_at
                )}
            </div>

        `;


        container.appendChild(row);

    });

}


/* =========================================
   DASHBOARD
========================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch(`${API_URL}/datasets`);


        const result =
            await response.json();


        if (!result.success) return;


        const datasets =
            result.datasets || [];


        /* Total datasets */

        const datasetCount =
            document.getElementById(
                "dashboardDatasetCount"
            );

        if (datasetCount) {

            datasetCount.textContent =
                datasets.length;

        }


        /* Total records */

        const totalRecords =
            datasets.reduce(
                (total, dataset) =>
                    total +
                    Number(dataset.row_count || 0),
                0
            );


        const recordCount =
            document.getElementById(
                "dashboardRecordCount"
            );

        if (recordCount) {

            recordCount.textContent =
                totalRecords;

        }


        /* Completed analyses */

        const analysisCount =
            document.getElementById(
                "dashboardAnalysisCount"
            );

        if (analysisCount) {

            analysisCount.textContent =
                datasets.filter(
                    dataset =>
                        dataset.processing_status ===
                        "completed"
                ).length;

        }


        /* Latest dataset */

        const latestDataset =
            document.getElementById(
                "dashboardLatestDataset"
            );


        if (latestDataset && datasets.length) {

            latestDataset.textContent =
                datasets[datasets.length - 1]
                    .file_name || "—";

        }


        /* Recent datasets */

        const recentContainer =
            document.getElementById(
                "recentDatasetsContainer"
            );


        if (recentContainer) {

            if (!datasets.length) {

                recentContainer.innerHTML =
                    `<div class="empty-message">
                        No datasets analyzed yet.
                    </div>`;

            } else {

                const recent =
                    datasets.slice(-5).reverse();


                recentContainer.innerHTML = "";


                recent.forEach(dataset => {

                    const row =
                        document.createElement("div");

                    row.className =
                        "dataset-row";


                    row.innerHTML = `

                        <div>
                            <div class="dataset-name">
                                ${escapeHTML(
                                    dataset.file_name ||
                                    "Dataset"
                                )}
                            </div>

                            <div class="dataset-meta">
                                ${dataset.row_count ?? 0}
                                records ·
                                ${dataset.column_count ?? 0}
                                columns
                            </div>
                        </div>

                        <div class="dataset-meta">
                            ${escapeHTML(
                                dataset.file_type || "—"
                            )}
                        </div>

                        <div>
                            <span class="dataset-status">
                                ${escapeHTML(
                                    dataset.processing_status ||
                                    "Completed"
                                )}
                            </span>
                        </div>

                        <div class="dataset-meta">
                            ${formatDate(
                                dataset.created_at
                            )}
                        </div>

                    `;


                    recentContainer.appendChild(row);

                });

            }

        }


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "—";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   AUTHENTICATION
========================================= */

async function checkAuthentication() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        showApplication(session);

    } else {

        showLogin();

    }

}


/* =========================================
   SHOW LOGIN
========================================= */

function showLogin() {

    if (loginScreen) {
        loginScreen.classList.remove("hidden");
    }

    if (appLayout) {
        appLayout.classList.add("hidden");
    }

}


/* =========================================
   SHOW APPLICATION
========================================= */

function showApplication(session) {

    if (loginScreen) {
        loginScreen.classList.add("hidden");
    }

    if (appLayout) {
        appLayout.classList.remove("hidden");
    }


    /* Display logged-in user's email */

    const userEmail =
        document.getElementById("userEmail");

    if (userEmail && session?.user?.email) {

        userEmail.textContent =
            session.user.email;

    }


    loadDashboard();

}


/* =========================================
   LOGIN
========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;


            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter your email and password.";

                loginMessage.style.color =
                    "#dc2626";

                return;

            }


            loginButton.disabled = true;

            loginButton.textContent =
                "Signing in...";

            loginMessage.textContent =
                "";


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email: email,
                            password: password
                        });


                if (error) {
                    throw error;
                }


                loginMessage.textContent =
                    "Login successful.";

                loginMessage.style.color =
                    "#16a34a";


                showApplication(data.session);


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                loginMessage.textContent =
                    error.message ||
                    "Unable to sign in.";

                loginMessage.style.color =
                    "#dc2626";


            } finally {

                loginButton.disabled = false;

                loginButton.textContent =
                    "Sign In";

            }

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const {
                error
            } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                return;

            }


            showLogin();

            if (loginForm) {
                loginForm.reset();
            }

            if (loginMessage) {
                loginMessage.textContent = "";
            }

        }
    );

}


/* =========================================
   AUTH STATE LISTENER
========================================= */

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        if (session) {

            showApplication(session);

        } else {

            showLogin();

        }

    }
);


/* =========================================
   INITIAL LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkAuthentication();

    }
);