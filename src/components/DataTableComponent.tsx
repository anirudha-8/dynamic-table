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
	const [rows, setRows] = useState(12);
	const [selectCount, setSelectCount] = useState(0);
	const op = useRef<OverlayPanel>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(
		new Set()
	);

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

	useEffect(() => {
		const page = first / rows + 1;
		fetchData(page, rows);
	}, [first, rows]);

	const onSelectionChange = (e: { value: Artwork[] }) => {
		const newSelectedIds = new Set<number>(selectedRowIds);

		const currentPageSelectedIds = e.value.map((row) => row.id);

		data.forEach((row) => {
			if (!currentPageSelectedIds.includes(row.id)) {
				newSelectedIds.delete(row.id);
			}
		});

		currentPageSelectedIds.forEach((id) => newSelectedIds.add(id));

		setSelectedRowIds(newSelectedIds);
	};

	const onPageChange = (e: DataTablePageEvent) => {
		setFirst(e.first);
		setRows(e.rows);
	};

	const isSelected = (row: Artwork) => {
		return selectedRowIds.has(row.id);
	};

	const selectMultipleRows = async (count: number) => {
		const selected = new Set<number>(selectedRowIds);
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
		op.current?.hide();
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
				selection={data.filter((row) => isSelected(row))}
				onSelectionChange={onSelectionChange}
				dataKey="id"
				lazy
				selectionMode="multiple"
			>
				<Column
					selectionMode="multiple"
					headerStyle={{ width: "3em" }}
					header={
						<>
							<i
								className="pi pi-filter"
								style={{ cursor: "pointer" }}
								onClick={(e) => op.current?.toggle(e)}
							></i>
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

				<Column field="title" header="Title"></Column>
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
