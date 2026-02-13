<?php
declare(strict_types=1);

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die();

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

// Подключаем автозагрузчик Composer для PhpSpreadsheet
$__composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (is_readable($__composerAutoload)) {
    require_once $__composerAutoload;
}
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
<title><?=Loc::getMessage('SALE_HPS_BILL_TITLE')?></title>
<meta http-equiv="Content-Type" content="text/html; charset=<?=LANG_CHARSET?>">
<style type="text/css">
	table { border-collapse: collapse; }
	table.acc td { border: 1pt solid #000000; padding: 0pt 3pt; line-height: 21pt; }
	table.it td { border: 1pt solid #000000; padding: 0pt 3pt; }
	table.sign td { font-weight: bold; vertical-align: bottom; }
	table.header td { padding: 0pt; vertical-align: top; }
 	body, table, td { font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 11pt; }
 	table.attn td { vertical-align: top; }
</style>
</head>

<?php

// Определяем, нужно ли отображать "чистый" бланк без печатей и подписей
$blank = ($_REQUEST['BLANK'] ?? 'N') === 'Y';

$pageWidth  = 595.28;
$pageHeight = 841.89;

$background = '#ffffff';
if ($params['BILL_BACKGROUND'])
{
	$path = $params['BILL_BACKGROUND'];
	if (intval($path) > 0)
	{
		if ($arFile = CFile::GetFileArray((int)$path))
			$path = $arFile['SRC'];
	}

	$backgroundStyle = $params['BILL_BACKGROUND_STYLE'];
	if (!in_array($backgroundStyle, array('none', 'tile', 'stretch')))
		$backgroundStyle = 'none';

	if ($path)
	{
		switch ($backgroundStyle)
		{
			case 'none':
				$background = "url('" . $path . "') 0 0 no-repeat";
				break;
			case 'tile':
				$background = "url('" . $path . "') 0 0 repeat";
				break;
			case 'stretch':
				$background = sprintf(
					"url('%s') 0 0 repeat-y; background-size: %.02fpt %.02fpt",
					$path, $pageWidth, $pageHeight
				);
				break;
		}
	}
}

$margin = [
	'top' => ((int)($params['BILL_MARGIN_TOP'] ?? 15)) * 72 / 25.4,
	'right' => ((int)($params['BILL_MARGIN_RIGHT'] ?? 15)) * 72 / 25.4,
	'bottom' => ((int)($params['BILL_MARGIN_BOTTOM'] ?? 15)) * 72 / 25.4,
	'left' => ((int)($params['BILL_MARGIN_LEFT'] ?? 20)) * 72 / 25.4,
];

$width = $pageWidth - $margin['left'] - $margin['right'];

// Определяем, нужно ли автоматически вызывать печать при открытии страницы
$isPrint = ($_REQUEST['PRINT'] ?? 'N') === 'Y';
?>

<body style="margin: 0pt; padding: 0pt; background: <?=htmlspecialcharsbx($background); ?>;"<? if ($isPrint): ?> onload="setTimeout(window.print, 0);"<? endif; ?>>

<div style="margin: 0pt; padding: <?=join('pt ', $margin); ?>pt; width: <?=$width; ?>pt; background: <?=$background; ?>">

<?php
// Готовим логотип (data URI, чтобы не зависеть от веб-пути)
$attnLogoDataUri = '';
$logoFs = __DIR__ . '/newlogo.png';
if (is_readable($logoFs)) {
    $imgData = base64_encode((string)file_get_contents($logoFs));
    $attnLogoDataUri = 'data:image/png;base64,' . $imgData;
}
?>


<?php if ($params['BILL_HEADER_SHOW'] === 'Y'): ?>
	<table class="header">
		<tr>
			<?php
			$logoPath = $params["BILL_PATH_TO_LOGO"] ?? null;
			if ($logoPath && ($logoFile = CFile::GetFileArray($logoPath))):
			?>
			<td style="padding-right: 5pt; padding-bottom: 5pt; ">
				<?php
					$dpi = (int)($params['BILL_LOGO_DPI'] ?? 96);
					$imgWidth = $logoFile['WIDTH'] * 96 / $dpi;
					if ($imgWidth > $pageWidth)
						$imgWidth = $pageWidth * 0.6;
				?>
				<img src="<?=htmlspecialcharsbx($logoFile['SRC']); ?>" width="<?=(int)$imgWidth; ?>" />
			</td>
			<?php endif; ?>
			<td>
				<b><?=htmlspecialcharsbx($params["SELLER_COMPANY_NAME"]); ?></b><br><?php
				if ($params["SELLER_COMPANY_ADDRESS"]) {
					$sellerAddr = $params["SELLER_COMPANY_ADDRESS"];
					if (is_array($sellerAddr))
						$sellerAddr = implode(', ', $sellerAddr);
					else
						$sellerAddr = str_replace(array("\r\n", "\n", "\r"), ', ', strval($sellerAddr));
					?><b><?=htmlspecialcharsbx($sellerAddr);?></b><br><?php
				} ?>
				<?php if ($params["SELLER_COMPANY_PHONE"]) { ?>
				<b><?=Loc::getMessage('SALE_HPS_BILL_SELLER_COMPANY_PHONE', array('#PHONE#' => htmlspecialcharsbx($params["SELLER_COMPANY_PHONE"])));?></b><br>
				<?php } ?>
			</td>
		</tr>
	</table>

	<?php
	if ($params["SELLER_COMPANY_BANK_NAME"])
	{
		$sellerBankCity = '';
		if ($params["SELLER_COMPANY_BANK_CITY"])
		{
			$sellerBankCity = (string)$params["SELLER_COMPANY_BANK_CITY"];
			if (is_array($sellerBankCity))
				$sellerBankCity = implode(', ', $sellerBankCity);
			else
				$sellerBankCity = str_replace(array("\r\n", "\n", "\r"), ', ', strval($sellerBankCity));
		}
		$sellerBank = sprintf(
			"%s %s",
			$params["SELLER_COMPANY_BANK_NAME"],
			htmlspecialcharsbx($sellerBankCity)
		);
		$sellerRs = $params["SELLER_COMPANY_BANK_ACCOUNT"];
	}
	else
	{
		$rsPattern = '/\s*\d{10,100}\s*/';

		$sellerBank = trim(preg_replace($rsPattern, ' ', $params["SELLER_COMPANY_BANK_ACCOUNT"]));

		preg_match($rsPattern, $params["SELLER_COMPANY_BANK_ACCOUNT"], $matches);
		$sellerRs = trim($matches[0]);
	}

	?>
	<table class="acc" width="100%">
		<colgroup>
			<col width="29%">
			<col width="29%">
			<col width="10%">
			<col width="32%">
		</colgroup>
		<tr>
			<td>
				<?php if ($params["SELLER_COMPANY_INN"]) { ?>
				<?=Loc::getMessage('SALE_HPS_BILL_INN', array('#INN#' => htmlspecialcharsbx($params["SELLER_COMPANY_INN"])));?>
				<?php } else { ?>
				&nbsp;
				<?php } ?>
			</td>
			<td>
				<?php if ($params["SELLER_COMPANY_KPP"]) { ?>
				<?=Loc::getMessage('SALE_HPS_BILL_KPP', array('#KPP#' => htmlspecialcharsbx($params["SELLER_COMPANY_KPP"])));?>
				<?php } else { ?>
				&nbsp;
				<?php } ?>
			</td>
			<td rowspan="2">
				<br>
				<br>
				<?=Loc::getMessage("SALE_HPS_BILL_SELLER_ACC"); ?>
			</td>
			<td rowspan="2">
				<br>
				<br>
				<?=htmlspecialcharsbx($sellerRs);?>
			</td>
		</tr>
		<tr>
			<td colspan="2">
				<?=Loc::getMessage('SALE_HPS_BILL_SELLER_NAME')?><br>
				<?=htmlspecialcharsbx($params["SELLER_COMPANY_NAME"]);?>
			</td>
		</tr>
		<tr>
			<td colspan="2">
				<?=Loc::getMessage('SALE_HPS_BILL_SELLER_BANK_NAME')?><br>
				<?=htmlspecialcharsbx($sellerBank);?>
			</td>
			<td>
				<?=Loc::getMessage('SALE_HPS_BILL_SELLER_BANK_BIK');?><br>
				<?=Loc::getMessage('SALE_HPS_BILL_SELLER_ACC_CORR')?><br>
			</td>
			<td>
				<?=htmlspecialcharsbx($params["SELLER_COMPANY_BANK_BIC"]); ?><br>
				<?=htmlspecialcharsbx($params["SELLER_COMPANY_BANK_ACCOUNT_CORR"]);?>
			</td>
		</tr>
	</table>
<?php endif;?>
<br>
<br>

<table width="100%">
	<colgroup>
		<col width="50%">
		<col width="0">
		<col width="50%">
	</colgroup>
<?php 
    $billHeader = trim((string)($params['BILL_HEADER'] ?? ''));
    if ($billHeader === '') {
        $billHeader = 'Счет-оферта';
    }
?>
<?php if ($billHeader):?>
	<tr>
		<td></td>
		<td style="font-size: 2em; font-weight: bold; text-align: center">
			<nobr>
				<?=htmlspecialcharsbx($billHeader);?> <?=Loc::getMessage('SALE_HPS_BILL_SELLER_TITLE', array('#PAYMENT_NUM#' => htmlspecialcharsbx($params["ACCOUNT_NUMBER"]), '#PAYMENT_DATE#' => htmlspecialcharsbx($params["PAYMENT_DATE_INSERT"])));?>
			</nobr>
		</td>
		<td></td>
	</tr>
<?php endif;?>
<?php if ($params["BILL_ORDER_SUBJECT"]) { ?>
	<tr>
		<td></td>
		<td><?=htmlspecialcharsbx($params["BILL_ORDER_SUBJECT"]); ?></td>
		<td></td>
	</tr>
<?php } ?>
<?php if ($params["PAYMENT_DATE_PAY_BEFORE"]) { ?>
	<tr>
		<td></td>
		<td>
			<?=Loc::getMessage('SALE_HPS_BILL_SELLER_DATE_END', array('#PAYMENT_DATE_END#' => ConvertDateTime($params["PAYMENT_DATE_PAY_BEFORE"], FORMAT_DATE) ?: htmlspecialcharsbx($params["PAYMENT_DATE_PAY_BEFORE"])));?>
		</td>
		<td></td>
	</tr>
<?php } ?>
</table>

<br>
<table class="attn" width="100%" style="margin-bottom: 12pt;">
	<tr>
		<td style="width: 90pt; padding-right: 10pt;">
			<?php if ($attnLogoDataUri): ?>
				<img src="<?=$attnLogoDataUri?>" alt="logo" style="max-width: 90pt; height: auto;" />
			<?php endif; ?>
		</td>
		<td>
			<?php 
			$attnHtml = (string)($params['BILL_ATTENTION_HTML'] ?? '');
			if ($attnHtml === '') {
				$attnHtml = 'Внимание! Оплата данного счета означает согласие с условиями оферты. Счет действителен в течение 3 (трех) банковских дней. При оплате, пожалуйста, указывайте номер и дату счета.';
			}
			echo $attnHtml;
			?>
		</td>
	</tr>
</table>
<?php

if ($params['BILL_PAYER_SHOW'] == 'Y'):
	if ($params["BUYER_PERSON_COMPANY_NAME"]) {
		echo Loc::getMessage('SALE_HPS_BILL_BUYER_NAME', array('#BUYER_NAME#' => htmlspecialcharsbx($params["BUYER_PERSON_COMPANY_NAME"])));
		if ($params["BUYER_PERSON_COMPANY_INN"])
			echo Loc::getMessage('SALE_HPS_BILL_BUYER_INN', array('#INN#' => htmlspecialcharsbx($params["BUYER_PERSON_COMPANY_INN"])));
		if ($params["BUYER_PERSON_COMPANY_ADDRESS"])
		{
			$buyerAddr = $params["BUYER_PERSON_COMPANY_ADDRESS"];
			if (is_array($buyerAddr))
				$buyerAddr = implode(', ', $buyerAddr);
			else
				$buyerAddr = str_replace(array("\r\n", "\n", "\r"), ', ', strval($buyerAddr));
			echo sprintf(", %s", htmlspecialcharsbx($buyerAddr));
		}
		if ($params["BUYER_PERSON_COMPANY_PHONE"])
			echo sprintf(", %s", htmlspecialcharsbx($params["BUYER_PERSON_COMPANY_PHONE"]));
		if ($params["BUYER_PERSON_COMPANY_FAX"])
			echo sprintf(", %s", htmlspecialcharsbx($params["BUYER_PERSON_COMPANY_FAX"]));
		if ($params["BUYER_PERSON_COMPANY_NAME_CONTACT"])
			echo sprintf(", %s", htmlspecialcharsbx($params["BUYER_PERSON_COMPANY_NAME_CONTACT"]));
	}
endif;
?>

<br>
<br>

<?php // Получение формата валюты
$arCurFormat = CCurrencyLang::GetFormatDescription($params['CURRENCY']);
$currency = preg_replace('/(^|[^&])#/', '${1}', $arCurFormat['FORMAT_STRING']);

$cells = array();
$props = array();

$n = 0;
$sum = 0.00;
$vat = 0;
$cntBasketItem = 0;

$columnList = array('NUMBER', 'NAME', 'QUANTITY', 'MEASURE', 'PRICE', 'VAT_RATE', 'SUM');
// Формирование колонок таблицы
$arCols = array();
$vatRateColumn = 0;
foreach ($columnList as $column)
{
	if ($params['BILL_COLUMN_'.$column.'_SHOW'] == 'Y')
	{
		$caption = $params['BILL_COLUMN_'.$column.'_TITLE'];
		$caption = htmlspecialcharsbx($caption, ENT_COMPAT, false);
		if (in_array($column, ['PRICE', 'SUM']))
		{
			$caption .= ', '.$currency;
		}

		$arCols[$column] = array(
			'NAME' => $caption,
			'SORT' => $params['BILL_COLUMN_'.$column.'_SORT']
		);
	}
}
if ($params['USER_COLUMNS'])
{
	$columnList = array_merge($columnList, array_keys($params['USER_COLUMNS']));
	foreach ($params['USER_COLUMNS'] as $id => $val)
	{
		$arCols[$id] = array(
			'NAME' => htmlspecialcharsbx($val['NAME'], ENT_COMPAT, false),
			'SORT' => $val['SORT']
		);
	}
}

uasort($arCols, function ($a, $b) {return ($a['SORT'] < $b['SORT']) ? -1 : 1;});

$arColumnKeys = array_keys($arCols);
$columnCount = count($arColumnKeys);

// Обработка товаров в корзине
if ($params['BASKET_ITEMS'])
{
	foreach ($params['BASKET_ITEMS'] as $basketItem)
	{
		$productName = $basketItem["NAME"];
		if ($productName == "OrderDelivery")
			$productName = Loc::getMessage('SALE_HPS_BILL_DELIVERY');
		else if ($productName == "OrderDiscount")
			$productName = Loc::getMessage('SALE_HPS_BILL_DISCOUNT');

		if ($basketItem['IS_VAT_IN_PRICE'])
			$basketItemPrice = $basketItem['PRICE'];
		else
			$basketItemPrice = $basketItem['PRICE']*(1 + $basketItem['VAT_RATE']);

		$cells[++$n] = array();
		foreach ($arCols as $columnId => $caption)
		{
			$data = null;

			switch ($columnId)
			{
				case 'NUMBER':
					$data = $n;
					break;
				case 'NAME':
					$data = htmlspecialcharsbx($productName);
					break;
				case 'QUANTITY':
					$data = roundEx($basketItem['QUANTITY'], SALE_VALUE_PRECISION);
					break;
				case 'MEASURE':
					$data = $basketItem["MEASURE_NAME"] ? htmlspecialcharsbx($basketItem["MEASURE_NAME"]) : Loc::getMessage('SALE_HPS_BILL_BASKET_MEASURE_DEFAULT');
					break;
				case 'PRICE':
					$data = SaleFormatCurrency($basketItem['PRICE'], $basketItem['CURRENCY'], true);
					break;
				case 'VAT_RATE':
					$data = roundEx($basketItem['VAT_RATE'] * 100, SALE_VALUE_PRECISION)."%";
					break;
				case 'SUM':
					$data = SaleFormatCurrency($basketItemPrice * $basketItem['QUANTITY'], $basketItem['CURRENCY'], true);
					break;
				default :
					$data = ($basketItem[$columnId]) ?: '';
			}
			if ($data !== null)
				$cells[$n][$columnId] = $data;
		}
		$props[$n] = array();
		/** @var \Bitrix\Sale\BasketPropertyItem $basketPropertyItem */
		if ($basketItem['PROPS'])
		{
			foreach ($basketItem['PROPS'] as $basketPropertyItem)
			{
				if ($basketPropertyItem['CODE'] == 'CATALOG.XML_ID' || $basketPropertyItem['CODE'] == 'PRODUCT.XML_ID')
					continue;
				$props[$n][] = htmlspecialcharsbx(sprintf("%s: %s", $basketPropertyItem["NAME"], $basketPropertyItem["VALUE"]));
			}
		}
		$sum += (float)($basketItem['PRICE'] * $basketItem['QUANTITY']);
		$vat = max($vat, $basketItem['VAT_RATE']);
	}
}

// Если нет НДС, удаляем колонку
if ($vat <= 0 && isset($arCols['VAT_RATE']))
{
	unset($arCols['VAT_RATE']);
	$columnCount = count($arCols);
	$arColumnKeys = array_keys($arCols);
	foreach ($cells as $i => $cell)
		unset($cells[$i]['VAT_RATE']);
}

// Обработка доставки
if ($params['DELIVERY_PRICE'] > 0)
{
	$deliveryItem = Loc::getMessage('SALE_HPS_BILL_DELIVERY');

	if ($params['DELIVERY_NAME'])
		$deliveryItem .= sprintf(" (%s)", htmlspecialcharsbx($params['DELIVERY_NAME']));
	$cells[++$n] = array();
	foreach ($arCols as $columnId => $caption)
	{
		$data = null;

		switch ($columnId)
		{
			case 'NUMBER':
				$data = $n;
				break;
			case 'NAME':
				$data = htmlspecialcharsbx($deliveryItem);
				break;
			case 'QUANTITY':
				$data = 1;
				break;
			case 'MEASURE':
				$data = '';
				break;
			case 'PRICE':
				$data = SaleFormatCurrency($params['DELIVERY_PRICE'], $params['CURRENCY'], true);
				break;
			case 'VAT_RATE':
				$data = roundEx($params['DELIVERY_VAT_RATE'] * 100, SALE_VALUE_PRECISION)."%";
				break;
			case 'SUM':
				$data = SaleFormatCurrency($params['DELIVERY_PRICE'], $params['CURRENCY'], true);
				break;
		}
		if ($data !== null)
			$cells[$n][$columnId] = $data;
	}
	$sum += (float)$params['DELIVERY_PRICE'];
}

// Формирование итоговых строк (сумма, налоги, скидки)
if ($params['BILL_TOTAL_SHOW'] === 'Y')
{
	$cntBasketItem = $n;
	$eps = 0.0001;
	if ($params['SUM'] - $sum > $eps)
	{
		$cells[++$n] = array();
		for ($i = 0; $i < $columnCount; $i++)
			$cells[$n][$arColumnKeys[$i]] = null;

		$cells[$n][$arColumnKeys[$columnCount-2]] = Loc::getMessage('SALE_HPS_BILL_SUBTOTAL');
		$cells[$n][$arColumnKeys[$columnCount-1]] = SaleFormatCurrency($sum, $params['CURRENCY'], true);
	}

	if ($params['TAXES'])
	{
		foreach ($params['TAXES'] as $tax)
		{
			$cells[++$n] = array();
			for ($i = 0; $i < $columnCount; $i++)
				$cells[$n][$arColumnKeys[$i]] = null;

			$cells[$n][$arColumnKeys[$columnCount-2]] = htmlspecialcharsbx(sprintf(
					"%s%s%s:",
					($tax["IS_IN_PRICE"] == "Y") ? Loc::getMessage('SALE_HPS_BILL_INCLUDING') : "",
					$tax["TAX_NAME"],
					($vat <= 0 && $tax["IS_PERCENT"] == "Y")
							? sprintf(' (%s%%)', roundEx($tax["VALUE"], SALE_VALUE_PRECISION))
							: ""
			));
			$cells[$n][$arColumnKeys[$columnCount-1]] = SaleFormatCurrency($tax["VALUE_MONEY"], $params['CURRENCY'], true);
		}
	}

	if (!$params['TAXES'])
	{
		$cells[++$n] = array();
		for ($i = 0; $i < $columnCount; $i++)
			$cells[$n][$i] = null;

		$cells[$n][$arColumnKeys[$columnCount-2]] = Loc::getMessage('SALE_HPS_BILL_TOTAL_VAT_RATE');
		$cells[$n][$arColumnKeys[$columnCount-1]] = Loc::getMessage('SALE_HPS_BILL_TOTAL_VAT_RATE_NO');
	}

	if ($params['SUM_PAID'] > 0)
	{
		$cells[++$n] = array();
		for ($i = 0; $i < $columnCount; $i++)
			$cells[$n][$arColumnKeys[$i]] = null;

		$cells[$n][$arColumnKeys[$columnCount-2]] = Loc::getMessage('SALE_HPS_BILL_TOTAL_PAID');
		$cells[$n][$arColumnKeys[$columnCount-1]] = SaleFormatCurrency($params['SUM_PAID'], $params['CURRENCY'], true);
	}
	if ($params['DISCOUNT_PRICE'] > 0)
	{
		$cells[++$n] = array();
		for ($i = 0; $i < $columnCount; $i++)
			$cells[$n][$arColumnKeys[$i]] = null;

		$cells[$n][$arColumnKeys[$columnCount-2]] = Loc::getMessage('SALE_HPS_BILL_TOTAL_DISCOUNT');
		$cells[$n][$arColumnKeys[$columnCount-1]] = SaleFormatCurrency($params['DISCOUNT_PRICE'], $params['CURRENCY'], true);
	}

	$cells[++$n] = array();
	for ($i = 0; $i < $columnCount; $i++)
		$cells[$n][$arColumnKeys[$i]] = null;

	$cells[$n][$arColumnKeys[$columnCount-2]] = Loc::getMessage('SALE_HPS_BILL_TOTAL_SUM');
	$cells[$n][$arColumnKeys[$columnCount-1]] = SaleFormatCurrency($params['SUM'], $params['CURRENCY'], true);
}
?>
<table class="it" width="100%">
	<tr>
	<?php foreach ($arCols as $columnId => $col):?>
		<td><?=$col['NAME'];?></td>
	<?php endforeach;?>
	</tr>
<?php

$rowsCnt = count($cells);
for ($n = 1; $n <= $rowsCnt; $n++): // Итерация по всем строкам (товары, доставка, итого)

	$accumulated = 0;
?>
	<tr valign="top">
	<?foreach ($arCols as $columnId => $col):?>
		<?
			if (!is_null($cells[$n][$columnId]))
			{
				if ($columnId === 'NUMBER')
				{?>
					<td align="center"><?=$cells[$n][$columnId];?></td>
				<?php }
				elseif ($columnId === 'NAME')
				{
				?> 
					<td align="<?=($n > $cntBasketItem) ? 'right' : 'left';?>"
						style="word-break: break-word; word-wrap: break-word; <? if ($accumulated) {?>border-width: 0pt 1pt 0pt 0pt; <? } ?>"
						<? if ($accumulated) { ?>colspan="<?=($accumulated+1); ?>"<? $accumulated = 0; } ?>>
						<?=$cells[$n][$columnId]; ?>
						<? if (isset($props[$n]) && is_array($props[$n])) { ?>
						<? foreach ($props[$n] as $property) { ?>
						<br>
						<small><?=$property; ?></small>
						<? } ?>
						<? } ?>
					</td>
				<?php }
				else
				{
					if (!is_null($cells[$n][$columnId]))
					{
						if ($columnId != 'VAT_RATE' || $vat > 0 || is_null($cells[$n][$columnId]) || $n > $cntBasketItem)
						{ ?>
							<td align="right"
								<? if ($accumulated) { ?>
								style="border-width: 0pt 1pt 0pt 0pt"
								colspan="<?=(($columnId == 'VAT_RATE' && $vat <= 0) ? $accumulated : $accumulated+1); ?>"
								<? $accumulated = 0; } ?>>
								<?if ($columnId == 'SUM' || $columnId == 'PRICE'):?>
									<nobr><?=$cells[$n][$columnId];?></nobr>
								<?else:?>
									<?=$cells[$n][$columnId]; ?>
								<?endif;?>
							</td>
						<? }
					}
					else
					{
						$accumulated++;
					}
				}
			}
			else
			{
				$accumulated++;
			}
		?>
	<?endforeach;?>
	</tr>

<?php endfor;?>
</table>
<br>

<?php if ($params['BILL_TOTAL_SHOW'] === 'Y'):?>
	<?=Loc::getMessage(
			'SALE_HPS_BILL_BASKET_TOTAL',
			array(
					'#BASKET_COUNT#' => $cntBasketItem,
					'#BASKET_PRICE#' => SaleFormatCurrency($params['SUM'], $params['CURRENCY'], false),
			)
	);?>
	<br>

	<b>
	<?php

	if (in_array($params['CURRENCY'], array("RUR", "RUB")))
	{
		echo Number2Word_Rus($params['SUM']);
	}
	else
	{
		echo SaleFormatCurrency(
			$params['SUM'],
			$params['CURRENCY'],
			false
		);
	}

	?>
	</b>
<?php endif;?>
<br>
<br>

<?php if ($params["BILL_COMMENT1"] || $params["BILL_COMMENT2"]) { ?>
<b><?=Loc::getMessage('SALE_HPS_BILL_COND_COMM')?></b>
<br>
	<?php if ($params["BILL_COMMENT1"]) { ?>
	<?=nl2br(HTMLToTxt(preg_replace(
		array('#</div>\s*<div[^>]*>#i', '#</?div>#i'), array('<br>', '<br>'),
		htmlspecialcharsback($params["BILL_COMMENT1"])
	), '', array(), 0)); ?>
	<br>
	<br>
	<?php } ?>
	<?php if ($params["BILL_COMMENT2"]) { ?>
	<?=nl2br(HTMLToTxt(preg_replace(
		array('#</div>\s*<div[^>]*>#i', '#</?div>#i'), array('<br>', '<br>'),
		htmlspecialcharsback($params["BILL_COMMENT2"])
	), '', array(), 0)); ?>
	<br>
	<br>
	<?php } ?>
<?php } ?>

<br>
<br>

<?php 
// Блок статичных условий оферты
$termsHtml = (string)($params['BILL_TERMS_HTML'] ?? '');
if ($termsHtml === '') {
    $termsHtml = '<b>Основные условия счет-оферты:</b><br>'
        .'<ol style="margin: 0; padding-left: 18pt;">'
        .'<li>Настоящий счет-оферта (далее – «Счет») является письменным предложением (офертой) Поставщика заключить Договор, которое направляется Покупателю в соответствии со тс. 432-444 ГК РФ. Договор заключается путем принятия (акцепта) оферты Покупателем в установленном порядке (п. 3. Ст. 438 ГК РФ), что считается соблюдением письменной формы договора (п. 3 ст. 434 ГК РФ).</li>'
        .'<li>Предметом настоящего счет оферты является поставка товарно-материальных ценностей в соответствии с Перечнем товаров Поставщиком (Наименование поставщика), Покупателю (Наименование покупателя).</li>'
        .'<li>Существенным условием договора является 100 % предоплата суммы, указанной в счете, по указанным реквизитам. Счет действителен в течение 5 (пяти) рабочих дней с указанной в нем даты выставления (срок акцепта оферты). При отсутствии оплаты в указанный срок настоящего счета счет-оферта признается недействительным.</li>'
        .'<li>Днем оплаты по настоящему счету-оферте является день зачисления указанных в данном счете денежных средств на расчетный счет Поставщика.</li>'
        .'<li>Оплата счета-оферты третьими лицами, а также неполная (частичная) оплата счета-оферты не допускается. Покупатель не имеет права производить выборочную оплату позиций счета-оферты и требовать поставку товара по выбранным позициям.</li>'
        .'<li>Поставка товара осуществляется в течение 5 (пяти) рабочих дней с момента оплаты настоящего счета.</li>'
        .'<li>Покупатель осматривает товар при получении. При приемке товара Покупатель осматривает комплектность товара, отсутствие видимых дефектов. В случае обнаружения дефектов и/или некомплектности товара Покупатель составляет Акт. При отказе Покупателя от составления Акта последующие предъявления претензий о некомплектности товара и/или его видимых дефектов Поставщик принимать не будет.</li>'
        .'<li>Покупатель осуществляет самовывоз товара со склада Поставщика, расположенного по адресу: г. Пенза, ул. Ставского, 4. Иной способ поставки товара согласовывается дополнительно.</li>'
        .'<li>При получении Покупателем товара самовывозом товар должен быть принят Покупателем не позднее 3 (трех) рабочих дней со дня получения от Поставщика информации о готовности товара к отгрузке и передаче товара. Указанная информация может быть доведена до Покупателя любым способом (по e-mail, факсу, телефонограммой).</li>'
        .'<li>Покупатель обязан принять товар либо лично, либо через уполномоченного представителя. Передача товара уполномоченному представителю происходит при предъявлении им документа, удостоверяющего личность и надлежащим образом оформленной доверенности на получение товарно-материальных ценностей. После получения товара покупатель обязуется подписать Товарную накладную. Подписание Покупателем либо его уполномоченным представителем товарной накладной означает согласие Покупателя с комплектностью и внешним видом товара.</li>'
        .'<li>Отсутствие у Покупателя либо его уполномоченного представителя надлежащим образом оформленных документов является основанием для Поставщика отказать в выдаче товара Покупателю (уполномоченному представителю) и отправить данный товар на склад на ответственное хранение бесплатно на срок не более 3 (трех) календарных дней. Далее товар находится на платном ответственном хранении согласно установленных Поставщиком тарифов.</li>'
        .'<li>Гарантийный срок на товар составляет 1 (один) год, за исключение случае, когда изготовителем (производителем) товара согласно прилагаемой к товару документации или иным открытым источникам установлен гарантийный срок менее 1 (одного) календарного года (в этом случае применяется гарантийный срок на товар, установленный изготовителем (производителем) товара) или если гарантийный срок не установлен (в этом случае признается, что гарантийный срок на товар не установлен). Претензии, предъявленные Покупателю или иным лицам, которым товар в последующем продан (передан), в том числе от потребителей, и связанные с ними убытки предъявлению Поставщику не подлежат.</li>'
        .'<li>Поставщик не несет ответственности перед Покупателем за невыполнение обязательств, вследствие обстоятельств, возникших помимо воли и желания сторон и которые нельзя предвидеть или избежать, включая объявленную или фактическую войну, гражданские волнения, эпидемии, блокаду, эмбарго, землетрясения, наводнения, пожары и другие стихийные бедствия. В случае невозможности Поставщиком исполнить свои обязательства по счету-оферте (в том числе в установленный срок), Поставщик вправе уведомить Покупателя об отказе от исполнения счета-оферты без обязательств возмещения убытков Покупателю. Соответствующее уведомление должно быть направлено Поставщиком Покупателю в течение 30 дней с момента принятия решения об отказе от исполнения счета-оферты в связи с обстоятельствами, изложенными в настоящем пункте. Неуведомление Поставщиком Покупателя не лишает Поставщика права на отказ от исполнения  счета-оферты без обязательств возмещения убытков Покупателю. Поставщик не несет ответственности за любые убытки, включая расходы, связанные с претензиями или требованиями третьих лиц, которые могут возникнуть в результате действия обстоятельств непреодолимой силы.</li>'
        .'<li>Любые споры, которые могут возникнуть между Поставщиком и Покупателем в связи с настоящей офертой и/или Договором, подлежат рассмотрению по месту нахождения Поставщика.</li>'
        .'</ol>';
}
?>

<div style="margin-top: 8pt;">
	<?=$termsHtml?>
</div>

<?php if ($params['BILL_SIGN_SHOW'] === 'Y'):?>
	<?php if (!$blank) { ?>
	<div style="position: relative; "><?=CFile::ShowImage(
			$params["BILL_PATH_TO_STAMP"],
		160, 160,
		'style="position: absolute; left: 40pt; "'
	); ?></div>
	<?php } ?>

	<div style="position: relative">
		<table class="sign">
			<?php if ($params["SELLER_COMPANY_DIRECTOR_POSITION"]) { ?>
			<tr>
				<td style="width: 150pt; "><?=htmlspecialcharsbx($params["SELLER_COMPANY_DIRECTOR_POSITION"]); ?></td>
				<td style="width: 160pt; border: 1pt solid #000000; border-width: 0pt 0pt 1pt 0pt; text-align: center; ">
					<?php if (!$blank) { ?>
					<?=CFile::ShowImage($params["SELLER_COMPANY_DIR_SIGN"], 200, 50); ?>
					<?php } ?>
				</td>
				<td>
					<?php if ($params["SELLER_COMPANY_DIRECTOR_NAME"]) { ?>
					(<?=htmlspecialcharsbx($params["SELLER_COMPANY_DIRECTOR_NAME"]); ?>)
					<?php } ?>
				</td>
			</tr>
			<tr><td colspan="3">&nbsp;</td></tr>
			<?php } ?>
			<?php if ($params["SELLER_COMPANY_ACCOUNTANT_POSITION"]) { ?>
			<tr>
				<td style="width: 150pt; "><?=htmlspecialcharsbx($params["SELLER_COMPANY_ACCOUNTANT_POSITION"]); ?></td>
				<td style="width: 160pt; border: 1pt solid #000000; border-width: 0pt 0pt 1pt 0pt; text-align: center; ">
					<?php if (!$blank) { ?>
					<?=CFile::ShowImage($params["SELLER_COMPANY_ACC_SIGN"], 200, 50); ?>
					<?php } ?>
				</td>
				<td>
					<?php if ($params["SELLER_COMPANY_ACCOUNTANT_NAME"]) { ?>
					(<?=htmlspecialcharsbx($params["SELLER_COMPANY_ACCOUNTANT_NAME"]); ?>)
					<?php } ?>
				</td>
			</tr>
			<?php } ?>
		</table>
	</div>
<?php endif;?>

</div>

</body>
</html>