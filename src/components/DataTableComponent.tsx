import React, { useState, useEffect, useRef } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import axios from "axios";

interface Artwork {
	id: number;
	title: string;
	place_of_origin: string;
	artist_display: string;
	inscriptions: string;
	date_start: number;
	date_end: number;
}

const DataTableComponent: React.FC = () => {
	const [data, setData] = useState<Artwork[]>([]);
	const [loading, setLoading] = useState(false);
	const [first, setFirst] = useState(0);
	const [totalRecords, setTotalRecords] = useState(0);
	const [rows, setRows] = useState(12); // 12 records per page
	const [selectCount, setSelectCount] = useState(0); // Track how many rows to select from the overlay
	const op = useRef<OverlayPanel>(null); // Reference to OverlayPanel
	const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(
		new Set()
	); // Global storage for selected row IDs

	// Fetch data from the API
	const fetchData = async (page: number, rowsPerPage: number) => {
		setLoading(true);
		try {
			const response = await axios.get(
				`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}`
			);
			const artworks = response.data.data;
			setData(artworks);
			setTotalRecords(response.data.pagination.total);
		} catch (error) {
			console.error("Error fetching data:", error);
		}
		setLoading(false);
	};

	// Fetch data when the page or rows per page changes
	useEffect(() => {
		const page = first / rows + 1;
		fetchData(page, rows);
	}, [first, rows]);

	// Handle row selection change (with checkboxes) for both selecting and deselecting rows
	const onSelectionChange = (e: { value: Artwork[] }) => {
		const newSelectedIds = new Set<number>(selectedRowIds); // Copy the existing selected rows

		const currentPageSelectedIds = e.value.map((row) => row.id); // Get currently selected rows on the current page

		// Check for deselected rows
		data.forEach((row) => {
			if (!currentPageSelectedIds.includes(row.id)) {
				newSelectedIds.delete(row.id); // Remove deselected rows
			}
		});

		// Add selected rows
		currentPageSelectedIds.forEach((id) => newSelectedIds.add(id));

		setSelectedRowIds(newSelectedIds); // Update global selected rows
	};

	// Handle page change
	const onPageChange = (e: DataTablePageEvent) => {
		setFirst(e.first);
		setRows(e.rows);
	};

	// Check if the row is already selected (for maintaining selection state)
	const isSelected = (row: Artwork) => {
		return selectedRowIds.has(row.id);
	};

	// Select multiple rows across pages
	const selectMultipleRows = async (count: number) => {
		const selected = new Set<number>(selectedRowIds); // Copy current selected row IDs
		let remainingToSelect = count;
		let page = first / rows + 1;

		while (remainingToSelect > 0) {
			const response = await axios.get(
				`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
			);
			const artworks = response.data.data;

			// Get the rows to select from the current page
			const toSelect = artworks.slice(0, remainingToSelect);
			toSelect.forEach((row) => selected.add(row.id));
			remainingToSelect -= toSelect.length;
			page++;
		}

		setSelectedRowIds(selected);
		op.current?.hide(); // Close the overlay after selecting
	};

	return (
		<div className="card">
			<DataTable
				value={data}
				paginator
				rows={rows}
				first={first}
				totalRecords={totalRecords}
				onPage={onPageChange}
				loading={loading}
				selection={data.filter((row) => isSelected(row))} // Filter data to match selected rows
				onSelectionChange={onSelectionChange}
				dataKey="id"
				lazy
				selectionMode="multiple"
			>
				{/* Checkbox Column for row selection */}
				<Column
					selectionMode="multiple"
					headerStyle={{ width: "3em" }}
				></Column>

				{/* First Column with the overlay trigger */}
				<Column
					field="title"
					header={
						<>
							<i
								className="pi pi-filter"
								style={{ cursor: "pointer" }}
								onClick={(e) => op.current?.toggle(e)}
							></i>{" "}
							Title
							<OverlayPanel ref={op}>
								<div>
									<p>Enter number of rows to select:</p>
									<input
										type="number"
										min="1"
										max={totalRecords}
										value={selectCount}
										onChange={(e) =>
											setSelectCount(
												Number(e.target.value)
											)
										}
									/>
									<br />
									<br />
									<Button
										label="Submit"
										className="p-button-success"
										onClick={() =>
											selectMultipleRows(selectCount)
										}
									/>
								</div>
							</OverlayPanel>
						</>
					}
				></Column>
				<Column
					field="place_of_origin"
					header="Place of Origin"
				></Column>
				<Column field="artist_display" header="Artist"></Column>
				<Column field="inscriptions" header="Inscriptions"></Column>
				<Column field="date_start" header="Date Start"></Column>
				<Column field="date_end" header="Date End"></Column>
			</DataTable>
		</div>
	);
};

export default DataTableComponent;
