import RowLeft from '../../../../components/row-left';
import RowRight from '../../../../components/row-right';
import {
	refresh,
	setAppendNewRowButtonIsLoading,
	setTeachers,
} from '../../../../redux/features/document';
import { openSnackbar } from '../../../../redux/features/snackbar';
import { RootState } from '../../../../redux/store';
import { getDaysInMonth, isWeekend } from '../../../../utils/documents';
import { Teacher } from '../../ogretmenler';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Loader } from 'rsuite';

interface Row {
	id: number;
	documentID: number;
	teacherID: number | null;
	courseCode: number | null;
	days: number[];
}

interface RowsProps {
	month: number;
	year: number;
}

const Rows: React.FC<RowsProps> = () => {
	const router = useRouter();
	const dispatch = useDispatch();
	const { token } = useSelector((state: RootState) => state.account);
	const { refreshValue } = useSelector((state: RootState) => state.document);
	const [id, setId] = useState<number | null>(null);
	const [month, setMonth] = useState<number | null>(null);
	const [year, setYear] = useState<number | null>(null);
	const [isNewLoading, setIsNewLoading] = useState<boolean>(false);
	const [isRowsLoading, setIsRowsLoading] = useState<boolean>(false);
	const [isParamsLoading, setIsParamsLoading] = useState<boolean>(true);
	const [isDownloadLoading, setIsDownloadLoading] = useState<boolean>(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [rows, setRows] = useState<Row[]>([]);
	const days = useMemo(() => {
		if (month === null || year === null) return [];
		const d: number[] = [];
		const numberOfDays = getDaysInMonth(month, year);
		for (let i = 1; i <= numberOfDays; i++) d.push(i);
		return d;
	}, [month, year]);
	const handleNewRow = useCallback(() => {
		if (id) {
			setIsNewLoading(true);
			axios
				.post(
					'/api/rows/new',
					{ documentID: id },
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)
				.then((res) => {
					setRows([...rows, res.data.data as Row]);
					setTimeout(() => {
						window.scrollTo({
							top: document.body.scrollHeight,
							behavior: 'smooth',
						});
					}, 500);
				})
				.catch(() => {
					dispatch(
						openSnackbar({
							message: 'Sat??r eklenirken bir hata olu??tu.',
							variant: 'error',
						}),
					);
				})
				.finally(() => {
					setIsNewLoading(false);
				});
		}
	}, [id, rows, dispatch, token]);
	const handleNewRowWithIndex = useCallback(
		(index: number, rowID: number) => {
			if (id) {
				dispatch(setAppendNewRowButtonIsLoading({ rowID, isLoading: true }));
				axios
					.post(
						'/api/rows/new',
						{ documentID: id },
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						},
					)
					.then((res) => {
						const row = res.data.data as Row;
						setRows([...rows.slice(0, index + 1), row, ...rows.slice(index + 1)]);
					})
					.catch(() => {
						dispatch(
							openSnackbar({
								message: 'Sat??r eklenirken bir hata olu??tu.',
								variant: 'error',
							}),
						);
					})
					.finally(() => {
						dispatch(setAppendNewRowButtonIsLoading({ rowID, isLoading: false }));
					});
			}
		},
		[id, rows, dispatch, token],
	);
	const handleDownload = useCallback(() => {
		const _downloadFiles = async () => {
			for (let i = 1; i <= 2; i++) {
				const link = document.createElement('a');
				link.href = `/api/documents/download?id=${id}&f=${i}&token=${token}`;
				link.setAttribute('download', `${id}_${i}.xlsx`);
				document.body.appendChild(link);
				link.click();
				link.parentNode?.removeChild(link);
			}
		};
		setIsDownloadLoading(true);
		_downloadFiles().finally(() => {
			setIsDownloadLoading(false);
		});
	}, [id, token]);
	// get rows
	useEffect(() => {
		if (id) {
			setIsRowsLoading(true);
			axios
				.get(`/api/rows/all?documentID=${id}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				.then((res) => {
					setRows(res.data as Row[]);
				})
				.catch(() => {
					dispatch(
						openSnackbar({
							message: 'Sat??rlar al??n??rken bir hata olu??tu.',
							variant: 'error',
						}),
					);
				})
				.finally(() => {
					setIsRowsLoading(false);
				});
			axios
				.get('/api/teachers/all', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				.then((res) => {
					dispatch(
						setTeachers(
							res.data.map((teacher: Teacher) => ({
								value: teacher.id,
								label: teacher.name,
							})),
						),
					);
				});
		}
	}, [id, dispatch, refreshValue, token]);
	// get params
	useEffect(() => {
		if (router.query.params) {
			setId(parseInt(router.query.params[0] as string));
			setMonth(parseInt(router.query.params[1] as string));
			setYear(parseInt(router.query.params[2] as string));
			setIsParamsLoading(false);
			document.body.classList.add('bg-gray-100');
		}
	}, [router]);
	return (
		<div className={'w-full h-full flex flex-col bg-gray-100'}>
			{isRowsLoading || isParamsLoading ? (
				<div className={'w-full px-4 py-8 flex justify-center items-center'}>
					<Loader size={'md'} />
				</div>
			) : (
				<div className={'w-full h-full'}>
					<div className={'flex fixed bg-gray-100 z-20'}>
						<div className={'pt-1 pb-1 mb-1 flex'}>
							<div className={'w-[28px] font-bold border-r-2'}>No</div>
							<div className={'w-[178px] ml-2 pl-2.5 font-bold'}>Ad Soyad</div>
							<div className={'w-[196px] font-bold border-r-2'}>Ek Ders Tipi</div>
						</div>
					</div>
					<div className={'flex w-full h-full mb-[42px]'}>
						<div className={'sticky left-0 z-10 mt-8 bg-gray-100'}>
							{rows.map((row, index) => (
								<RowLeft
									key={row.id}
									id={row.id}
									index={index + 1}
									teacherID={row.teacherID}
									courseCode={row.courseCode}
									onNewRow={() => handleNewRowWithIndex(index, row.id)}
								/>
							))}
						</div>
						<div>
							<div
								className={
									'w-full sticky top-0 z-10 pl-2 h-8 flex justify-left items-center bg-gray-100'
								}
							>
								{days.map((day) => (
									<span
										key={day}
										className={`w-[30px] min-w-[30px] h-[30px] flex justify-center items-center mx-1 font-bold ${
											isWeekend(day, month as number, year as number)
												? 'cell-day-weekend'
												: ''
										}`.trim()}
									>
										{day}
									</span>
								))}
							</div>
							{rows.map((row) => (
								<RowRight
									key={row.id}
									id={row.id}
									days={row.days}
									month={month as number}
									year={year as number}
								/>
							))}
						</div>
					</div>
					<div className={'fixed bottom-0 left-0 flex w-full z-20 bg-gray-100 py-2'}>
						<label className={'inline-block mr-2'}>
							<Button
								size={'xs'}
								color={'green'}
								appearance={'primary'}
								loading={isNewLoading}
								disabled={isNewLoading}
								onClick={handleNewRow}
							>
								Yeni sat??r ekle
							</Button>
						</label>
						<label className={'inline-block mr-2'}>
							<Button
								size={'xs'}
								appearance={'primary'}
								onClick={() => dispatch(refresh())}
							>
								Yeniden s??rala
							</Button>
						</label>
						<label className={'inline-block'}>
							<Button
								size={'xs'}
								appearance={'primary'}
								loading={isDownloadLoading}
								disabled={isDownloadLoading}
								onClick={handleDownload}
							>
								Dosyalar?? indir
							</Button>
						</label>
						{downloadError && (
							<div
								className={
									'ml-4 font-source-sans font-extrabold text-red-500 leading-6'
								}
							>
								{downloadError}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default Rows;
